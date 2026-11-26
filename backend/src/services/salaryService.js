const Employee = require('../models/Employee');
const MasterData = require('../models/MasterData');
const User = require('../models/User');
const { httpError } = require('../utils/httpError');
const { escapeRegex } = require('../utils/validation');

function exactPattern(value) {
	return new RegExp(`^${escapeRegex(String(value).trim())}$`, 'i');
}

function sameText(left, right) {
	return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();
}

function dailySalaryFor(basicPay, dearnessAllowance = 0, otherAllowanceAmount = 0) {
	return Math.round((basicPay + dearnessAllowance + otherAllowanceAmount) * 100) / 100;
}

/** Throws unless the organization has the government type and area that employee salaries depend on. */
function requireSalarySchedule(organization) {
	if (!organization.governmentType || !organization.area) {
		throw httpError(400, `Set the government type and area of ${organization.organizationName} first. Employee salaries depend on them.`);
	}
}

/**
 * Returns the master data rate of a category of skill for an organization's government type and area.
 * Throws when the organization, its government type or area is missing, or no rate is set for that combination.
 */
async function findSkillRate(skillCategory, organizationId) {
	const item = await MasterData.findOne({ type: 'skillCategory', code: String(skillCategory).trim().toLowerCase() }).select('name rates').lean();
	if (!item) return null;
	if (!organizationId) {
		throw httpError(400, 'Assign the employee to an organization first. The salary depends on the organization\'s government type and area.');
	}
	const organization = await User.findOne({ _id: organizationId, role: 'organization' }).select('organizationName governmentType area').lean();
	if (!organization) throw httpError(404, 'Organization not found.');
	requireSalarySchedule(organization);
	const rate = (item.rates || []).find((entry) => sameText(entry.governmentType, organization.governmentType) && sameText(entry.area, organization.area));
	if (!rate) {
		throw httpError(400, `No salary is set for ${item.name} under ${organization.governmentType} · ${organization.area}. Add it in Settings → Master data → Category of skill.`);
	}
	return rate.salary;
}

/**
 * Basic pay of a category of skill for a government type and area as it was on `date` (YYYY-MM-DD).
 * Archived rate periods run from `effectiveFrom` up to the day before `effectiveTo`; a period that ends on or
 * before its start was replaced before it ever applied and is ignored. Dates older than every period use the
 * oldest one. Returns null when no rate exists for that government type and area.
 */
function skillBasicOn(skillItem, governmentType, area, date) {
	const rateIn = (rates) => (rates || []).find((entry) => sameText(entry.governmentType, governmentType) && sameText(entry.area, area));
	const current = rateIn(skillItem.rates);
	if (!skillItem.effectiveFrom || date >= skillItem.effectiveFrom) return current ? current.salary : null;
	const periods = (skillItem.rateHistory || []).filter((period) => rateIn(period.rates)
		&& !(period.effectiveFrom && period.effectiveTo && period.effectiveTo <= period.effectiveFrom));
	const covering = [...periods].reverse().find((period) => (period.effectiveFrom || '') <= date && (!period.effectiveTo || date < period.effectiveTo));
	const oldest = [...periods].sort((left, right) => (left.effectiveFrom || '').localeCompare(right.effectiveFrom || ''))[0];
	const period = covering || oldest;
	if (period) return rateIn(period.rates).salary;
	return current ? current.salary : null;
}

/**
 * Loads category-of-skill rate history and organization schedules for the given employees, so payroll can price
 * each attendance day with the rate that applied on that day.
 */
async function loadSkillPayLookup(employees) {
	const codes = [...new Set(employees.map((employee) => String(employee.skillCategory || '').trim().toLowerCase()).filter(Boolean))];
	const organizationIds = [...new Set(employees.map((employee) => String(employee.organizationId || '')).filter(Boolean))];
	if (codes.length === 0 || organizationIds.length === 0) return null;
	const [skills, organizations] = await Promise.all([
		MasterData.find({ type: 'skillCategory', code: { $in: codes } }).select('code rates effectiveFrom rateHistory').lean(),
		User.find({ _id: { $in: organizationIds }, role: 'organization' }).select('governmentType area').lean(),
	]);
	if (skills.length === 0) return null;
	return {
		skillByCode: new Map(skills.map((skill) => [skill.code, skill])),
		organizationById: new Map(organizations.map((organization) => [String(organization._id), organization])),
	};
}

/**
 * Daily wage of an employee on `date` (YYYY-MM-DD): auto-linked category-of-skill pay uses the rate valid that
 * day (keeping DA and allowances); a basic pay that is not today's skill rate was set by hand and is left alone.
 */
function dailySalaryOn(employee, date, lookup) {
	const current = Number(employee.dailySalary) || 0;
	if (!lookup || !date) return current;
	const skill = lookup.skillByCode.get(String(employee.skillCategory || '').trim().toLowerCase());
	const organization = lookup.organizationById.get(String(employee.organizationId || ''));
	if (!skill || !organization?.governmentType || !organization?.area) return current;
	const today = skillBasicOn(skill, organization.governmentType, organization.area, '9999-12-31');
	const then = skillBasicOn(skill, organization.governmentType, organization.area, date);
	if (then === null || today === null || Number(employee.basicPay) !== today || then === today) return current;
	return Math.round((current - today + then) * 100) / 100;
}

/**
 * Employees as they were paid on `date`: their basic pay always holds today's category of skill rate, so it is
 * swapped for the rate valid on `date`, keeping their own DA and allowances. Employees with a basic pay that is not
 * today's skill rate were set by hand and are left as they are.
 */
async function withSkillPayOn(employees, date) {
	if (!date) return employees;
	const lookup = await loadSkillPayLookup(employees);
	if (!lookup) return employees;
	return employees.map((employee) => {
		const dailySalary = dailySalaryOn(employee, date, lookup);
		if (dailySalary === (Number(employee.dailySalary) || 0)) return employee;
		const delta = dailySalary - (Number(employee.dailySalary) || 0);
		return { ...employee, basicPay: Math.round(((Number(employee.basicPay) || 0) + delta) * 100) / 100, dailySalary };
	});
}

/** Re-applies the fixed basic pay of each employee's category of skill for their organization's government type and area. */
async function recalculateEmployeeSalaries(employeeFilter = {}) {
	const [skills, organizations] = await Promise.all([
		MasterData.find({ type: 'skillCategory' }).select('name rates').lean(),
		User.find({ role: 'organization', governmentType: { $nin: ['', null] }, area: { $nin: ['', null] } }).select('governmentType area').lean(),
	]);
	const updates = [];
	for (const skill of skills) {
		for (const { governmentType, area, salary } of skill.rates || []) {
			const organizationIds = organizations
				.filter((organization) => sameText(organization.governmentType, governmentType) && sameText(organization.area, area))
				.map(({ _id }) => _id);
			if (organizationIds.length === 0) continue;
			updates.push(Employee.updateMany(
				{ $and: [employeeFilter, { skillCategory: exactPattern(skill.name), organizationId: { $in: organizationIds } }] },
				[{
					$set: {
						basicPay: salary,
						dailySalary: {
							$round: [{ $add: [salary, { $ifNull: ['$dearnessAllowance', 0] }, { $ifNull: ['$otherAllowanceAmount', 0] }] }, 2],
						},
					},
				}],
				{ updatePipeline: true },
			));
		}
	}
	await Promise.all(updates);
}

module.exports = {
	dailySalaryFor,
	dailySalaryOn,
	findSkillRate,
	loadSkillPayLookup,
	recalculateEmployeeSalaries,
	requireSalarySchedule,
	skillBasicOn,
	withSkillPayOn,
};
