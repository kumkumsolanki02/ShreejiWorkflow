import { Box, Flex, HStack, Heading, Image, Text, createIcon } from '@chakra-ui/react';
import { BrandMark } from '../../../components/layout/BrandLogo';
import { PeopleIcon } from '../../../components/ui/icons';
import loginTeamMobile from '../../../assets/login-team-mobile.png';
import FeatureTile from './FeatureTile';

const CalendarIcon = createIcon({
    displayName: 'CalendarIcon',
    viewBox: '0 0 24 24',
    path: (
        <path
            fill="currentColor"
            d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2ZM5 9v10h14V9H5Zm2 2h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-8 4h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
        />
    ),
});

const PayrollIcon = createIcon({
    displayName: 'PayrollIcon',
    viewBox: '0 0 24 24',
    path: (
        <path fill="currentColor" d="M3 15h4v6H3v-6Zm7-5h4v11h-4V10Zm7-7h4v18h-4V3Z" />
    ),
});

const ShieldIcon = createIcon({
    displayName: 'ShieldIcon',
    viewBox: '0 0 24 24',
    path: (
        <path
            fill="currentColor"
            d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6Z"
        />
    ),
});

const shortPhoneQuery = '@media (max-width: 61.99em) and (max-height: 690px)';
const mediumPhoneQuery = '@media (max-width: 61.99em) and (max-height: 820px)';

const features = [
    { icon: <PeopleIcon />, label: 'Manage\nEmployees' },
    { icon: <CalendarIcon />, label: 'Track\nAttendance' },
    { icon: <PayrollIcon />, label: 'Handle\nPayroll' },
    { icon: <ShieldIcon />, label: 'Secure &\nReliable' },
];

export function AuthFeatureList() {
    return (
        <Flex gap={{ base: 2, lg: 2.5 }} maxW={{ lg: '600px' }}>
            {features.map((feature) => (
                <FeatureTile key={feature.label} icon={feature.icon} label={feature.label} flex="1 1 0" />
            ))}
        </Flex>
    );
}

export function AuthMobileFeatures() {
    return (
        <Box pb="clamp(12px, 2dvh, 20px)" sx={{ [mediumPhoneQuery]: { display: 'none' } }}>
            <AuthFeatureList />
        </Box>
    );
}

function AuthBrandHeader() {
    return (
        <HStack
            display={{ base: 'none', lg: 'flex' }}
            spacing={0}
            align="center"
            justify="flex-start"
        >
            <BrandMark boxSize="84px" flexShrink={0} mr="16px" />
            <Box w="1.5px" h="62px" bg="#D1D5E0" flexShrink={0} mr="16px" />
            <Box textAlign="left" minW={0}>
                <Text
                    fontFamily="heading"
                    fontSize="28px"
                    fontWeight="800"
                    color="#1E293B"
                    lineHeight="1.12"
                    letterSpacing="-0.03em"
                >
                    Shreeji Caretaker
                </Text>
                <Text mt="7px" fontSize="15px" color="#94A3B8" fontWeight="500" lineHeight="1.3">
                    Manpower &amp; Workforce Solutions
                </Text>
            </Box>
        </HStack>
    );
}

function AuthStoryPanel() {
    return (
        <Box position="relative" color="slate.900">
            <AuthBrandHeader />

            <Heading
                as="h2"
                mt={{ base: 'clamp(12px, 2.6dvh, 24px)', lg: '3.2vh' }}
                maxW={{ base: '230px', sm: '250px', lg: 'none' }}
                fontSize={{ base: 'clamp(22px, 3.1dvh, 26px)', sm: 'clamp(22px, 3.1dvh, 28px)', lg: 'clamp(2rem, min(3.3vw, 5.8vh), 3.6rem)' }}
                lineHeight={{ base: '1.12', lg: '1.06' }}
                fontWeight="800"
                letterSpacing="-0.02em"
            >
                Your Complete
                <br />
                <Text as="span" color="brand.500">
                    Employee Management
                </Text>
                <br />
                Solution
            </Heading>

            <Text
                mt={{ base: 2, lg: '2.4vh' }}
                maxW={{ base: '56%', lg: '440px' }}
                color="slate.600"
                fontSize={{ base: '12.5px', lg: 'clamp(0.875rem, min(1.15vw, 2vh), 1.05rem)' }}
                lineHeight={{ base: '1.5', lg: '1.6' }}
                sx={{ [shortPhoneQuery]: { display: 'none' } }}
            >
                Simplify HR processes, manage attendance, handle payroll<Box as="span" display={{ base: 'none', lg: 'inline' }}>, track expenses,</Box>{' '}
                and more &mdash; all in one place.
            </Text>

            <Box display={{ base: 'none', lg: 'block' }} mt="3vh">
                <AuthFeatureList />
            </Box>

            <Image
                display={{ base: 'block', lg: 'none' }}
                src={loginTeamMobile}
                alt=""
                position="absolute"
                top="clamp(56px, 10dvh, 96px)"
                right={{ base: '-20px', sm: '-24px' }}
                w="46%"
                maxW="210px"
                zIndex={-1}
                sx={{
                    maskImage: 'linear-gradient(to right, transparent, #000 24%), linear-gradient(to top, transparent, #000 24%)',
                    maskComposite: 'intersect',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, #000 24%), linear-gradient(to top, transparent, #000 24%)',
                    WebkitMaskComposite: 'source-in',
                }}
            />
        </Box>
    );
}

export default AuthStoryPanel;
