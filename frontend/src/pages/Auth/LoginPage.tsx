import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, HStack, Icon, Skeleton, SkeletonCircle, Stack, Text } from '@chakra-ui/react';
import { BrandMark } from '../../components/layout/BrandLogo';
import DeveloperContact from '../../components/layout/DeveloperContact';
import AuthStoryPanel, { AuthMobileFeatures } from './components/AuthStoryPanel';
import LoginForm from './components/LoginForm';
import AuthLayout from '../../components/layout/AuthLayout';
import { getDashboardPath } from '../../app/authorization';
import { getSessionUser } from '../../services/api';

const ACCENT = '#6366F1';

function WorkersIcon(props: Record<string, unknown>) {
    return (
        <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Icon>
    );
}

function SitesIcon(props: Record<string, unknown>) {
    return (
        <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="3" y="14" width="5" height="7" rx="1" />
            <rect x="12" y="12" width="4" height="4" rx="1" />
            <rect x="18" y="12" width="3" height="9" rx="1" />
            <rect x="12" y="18" width="4" height="3" rx="1" />
        </Icon>
    );
}

function CommitmentIcon(props: Record<string, unknown>) {
    return (
        <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M8.5 14.5 5 11l2-2 3.5 3.5" />
            <path d="m14 9 2-2 3.5 3.5-2 2" />
            <path d="M8.5 14.5 11 17a2.1 2.1 0 0 0 3 0l5-5a2.1 2.1 0 0 0 0-3l-1-1" />
            <path d="M5 11 3.5 12.5a2.1 2.1 0 0 0 0 3L8 20a2.1 2.1 0 0 0 3 0l1.5-1.5" />
            <path d="M12 8.5 13.5 7a2.1 2.1 0 0 1 3 0l1 1" />
        </Icon>
    );
}

function ShieldIcon(props: Record<string, unknown>) {
    return (
        <Icon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
        </Icon>
    );
}

const trustStats: { icon: (props: Record<string, unknown>) => ReactNode; label: string }[] = [
    { icon: WorkersIcon, label: '2500+ Workers' },
    { icon: SitesIcon, label: '50+ Sites' },
    { icon: CommitmentIcon, label: '100% Commitment' },
];

function LoginBrandHeader() {
    return (
        <HStack spacing={0} align="center" w="full" justify="flex-start">
            <BrandMark boxSize="68px" flexShrink={0} mr="14px" />
            <Box w="1px" h="52px" bg="#D8DCE8" flexShrink={0} mr="14px" />
            <Box textAlign="left" minW={0}>
                <Text
                    fontFamily="heading"
                    fontSize="22px"
                    fontWeight="800"
                    color="#1E293B"
                    lineHeight="1.15"
                    letterSpacing="-0.03em"
                >
                    Shreeji Caretaker
                </Text>
                <Text mt="6px" fontSize="13px" color="#94A3B8" fontWeight="500" lineHeight="1.3">
                    Manpower &amp; Workforce Solutions
                </Text>
            </Box>
        </HStack>
    );
}

function LoginTrustFooter() {
    return (
        <Stack spacing="12px" align="stretch">
            <HStack spacing="10px" align="center">
                <Box flex="1" h="1px" bg="#EEF0F6" />
                <HStack spacing="6px" color="#94A3B8" flexShrink={0}>
                    <ShieldIcon boxSize="13px" />
                    <Text fontSize="11px" fontWeight="500" letterSpacing="0.01em" whiteSpace="nowrap">
                        Secure Workforce Access
                    </Text>
                </HStack>
                <Box flex="1" h="1px" bg="#EEF0F6" />
            </HStack>

            <HStack justify="space-between" align="flex-start" spacing={2} px="2px">
                {trustStats.map(({ icon: StatIcon, label }) => (
                    <Stack key={label} spacing="6px" align="center" flex="1" minW={0}>
                        <StatIcon boxSize="18px" color={ACCENT} />
                        <Text fontSize="11px" fontWeight="600" color={ACCENT} textAlign="center" lineHeight="1.25">
                            {label}
                        </Text>
                    </Stack>
                ))}
            </HStack>
        </Stack>
    );
}

function LoginPage() {
    const navigate = useNavigate();
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        let isActive = true;

        void getSessionUser().then((user) => {
            if (!isActive) return;
            if (user) navigate(getDashboardPath(user.role), { replace: true });
            else setIsCheckingSession(false);
        });

        return () => {
            isActive = false;
        };
    }, [navigate]);

    if (isCheckingSession) {
        return (
            <Flex minH="100vh" align="center" justify="center" bg="slate.50" p={4}>
                <Stack w="100%" maxW="400px" spacing={4} bg="white" p={8} borderRadius="xl" boxShadow="sm">
                    <SkeletonCircle size="12" alignSelf="center" />
                    <Skeleton h="20px" w="60%" alignSelf="center" />
                    <Skeleton h="12px" w="80%" alignSelf="center" />
                    <Skeleton h="44px" borderRadius="md" />
                    <Skeleton h="44px" borderRadius="md" />
                    <Skeleton h="44px" borderRadius="md" />
                </Stack>
            </Flex>
        );
    }

    return (
        <AuthLayout
            storyPanel={<AuthStoryPanel />}
            mobileFooter={<AuthMobileFeatures />}
            cornerNote={<DeveloperContact fontSize="xs" />}
            showMobileBrandMark={false}
        >
            <Stack align="stretch" spacing="18px" textAlign="center" color="slate.900">
                <LoginBrandHeader />

                <Stack spacing="10px" align="center">
                    <Heading
                        as="h1"
                        fontSize="26px"
                        fontWeight="800"
                        color="#0F172A"
                        letterSpacing="-0.02em"
                        lineHeight="1.15"
                        textAlign="center"
                    >
                        Welcome Back!
                    </Heading>
                    <Text
                        color="#64748B"
                        fontSize="14.5px"
                        fontWeight="400"
                        lineHeight="1.4"
                        textAlign="center"
                    >
                        Sign in to your workforce account
                    </Text>
                </Stack>

                <LoginForm />
                <LoginTrustFooter />
            </Stack>
        </AuthLayout>
    );
}

export default LoginPage;
