import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link as CLink,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDownIcon, CloseIcon, HamburgerIcon, PhoneIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BrandMark } from '../../../components/layout/BrandLogo';
import { COMPANY } from '../../../seo/siteConfig';
import { M } from '../theme';

const NAV = [
  { to: '/', label: 'Home', hash: '', dropdown: false },
  { to: '/services', label: 'Services', hash: '', dropdown: true },
  { to: '/#industries', label: 'Industries', hash: 'industries', dropdown: true },
  { to: '/about', label: 'About', hash: '', dropdown: false },
  { to: '/#testimonials', label: 'Testimonials', hash: 'testimonials', dropdown: false },
  { to: '/contact', label: 'Contact', hash: '', dropdown: false },
] as const;

type MarketingShellProps = {
  children: ReactNode;
};

function LogoBlock({ light = false }: { light?: boolean }) {
  return (
    <HStack spacing={{ base: 2, md: 2.5 }} as={RouterLink} to="/" _hover={{ textDecoration: 'none' }} aria-label="Shreeji Caretaker home">
      <BrandMark boxSize={{ base: 8, md: 9 }} color={light ? M.orange : M.navy} flexShrink={0} />
      <Box lineHeight="1.15" minW={0}>
        <Text
          fontFamily={M.font}
          fontWeight="800"
          fontSize={{ base: 'sm', md: 'md' }}
          color={light ? 'white' : M.navy}
          letterSpacing="-0.02em"
          noOfLines={1}
        >
          Shreeji Caretaker
        </Text>
        <Text
          fontSize={{ base: '9px', md: '10px' }}
          fontWeight="600"
          color={light ? 'whiteAlpha.700' : M.muted}
          letterSpacing="0.04em"
          textTransform="uppercase"
          noOfLines={1}
        >
          Manpower Solutions
        </Text>
      </Box>
    </HStack>
  );
}

function useNavActive() {
  const { pathname, hash } = useLocation();
  return (item: (typeof NAV)[number]) => {
    if (item.hash) return pathname === '/' && hash === `#${item.hash}`;
    if (item.to === '/') return pathname === '/' && !hash;
    return pathname === item.to;
  };
}

/** Top nav — light page header OR on-navy (inside hero card) */
export function MarketingTopNav({ variant = 'light' }: { variant?: 'light' | 'onNavy' }) {
  const menu = useDisclosure();
  const isActive = useNavActive();
  const onNavy = variant === 'onNavy';

  return (
    <Box w="full">
      <Flex align="center" justify="space-between" gap={2} w="full">
        <Box maxW={{ base: '70%', md: 'none' }} overflow="hidden">
          <LogoBlock light={onNavy} />
        </Box>

        <HStack
          as="nav"
          display={{ base: 'none', lg: 'flex' }}
          spacing={0.5}
          bg="white"
          px={2}
          py={1.5}
          borderRadius="full"
          boxShadow={onNavy ? '0 8px 28px rgba(0,0,0,0.18)' : '0 4px 18px rgba(10,35,66,0.08)'}
          border="1px solid"
          borderColor={onNavy ? 'transparent' : M.line}
          aria-label="Primary"
        >
          {NAV.map((item) => {
            const active = isActive(item);
            return (
              <CLink
                key={item.label}
                as={RouterLink}
                to={item.to}
                px={{ base: 2.5, xl: 3 }}
                py={1.5}
                borderRadius="full"
                fontSize={{ base: '12px', xl: '13px' }}
                fontWeight={active ? '700' : '500'}
                color={active ? '#1B4F9C' : M.navy}
                position="relative"
                display="inline-flex"
                alignItems="center"
                gap={0.5}
                whiteSpace="nowrap"
                _hover={{ bg: 'blackAlpha.50', textDecoration: 'none' }}
                _after={
                  active
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: '3px',
                        w: '16px',
                        h: '2px',
                        bg: '#1B4F9C',
                        borderRadius: 'full',
                      }
                    : undefined
                }
              >
                {item.label}
                {item.dropdown ? <ChevronDownIcon boxSize={3.5} opacity={0.7} /> : null}
              </CLink>
            );
          })}
        </HStack>

        <HStack spacing={1} flexShrink={0}>
          <Button
            as="a"
            href={`tel:${COMPANY.phone}`}
            display={{ base: 'none', md: 'inline-flex' }}
            bg={M.navy}
            color="white"
            borderRadius="full"
            size="sm"
            h="40px"
            px={4}
            leftIcon={<PhoneIcon boxSize={3} />}
            _hover={{ bg: M.navyMid, color: 'white' }}
            _active={{ bg: M.navyDeep }}
            fontWeight="600"
            fontSize="13px"
            boxShadow={onNavy ? '0 6px 18px rgba(0,0,0,0.25)' : undefined}
            sx={{ color: '#fff !important' }}
          >
            {COMPANY.phoneDisplay}
          </Button>
          {/* Quick call on mobile */}
          <IconButton
            as="a"
            href={`tel:${COMPANY.phone}`}
            aria-label={`Call ${COMPANY.phoneDisplay}`}
            icon={<PhoneIcon boxSize={3.5} />}
            display={{ base: 'inline-flex', md: 'none' }}
            variant="ghost"
            color={onNavy ? 'white' : M.navy}
            borderRadius="full"
            bg={onNavy ? 'whiteAlpha.150' : 'blackAlpha.50'}
            _hover={{ bg: onNavy ? 'whiteAlpha.300' : 'blackAlpha.100' }}
          />
          <IconButton
            aria-label={menu.isOpen ? 'Close menu' : 'Open menu'}
            icon={menu.isOpen ? <CloseIcon boxSize={3} /> : <HamburgerIcon boxSize={5} />}
            variant="ghost"
            color={onNavy ? 'white' : M.navy}
            display={{ base: 'inline-flex', lg: 'none' }}
            onClick={menu.onToggle}
            _hover={{ bg: onNavy ? 'whiteAlpha.200' : undefined }}
          />
        </HStack>
      </Flex>

      {menu.isOpen && (
        <Stack
          spacing={1}
          pt={3}
          pb={2}
          display={{ lg: 'none' }}
          bg={onNavy ? 'rgba(10,25,47,0.96)' : 'transparent'}
          borderRadius="xl"
          mt={onNavy ? 2 : 0}
          px={onNavy ? 1 : 0}
        >
          {NAV.map((item) => (
            <CLink
              key={item.label}
              as={RouterLink}
              to={item.to}
              onClick={menu.onClose}
              px={3}
              py={3}
              borderRadius="lg"
              fontWeight={isActive(item) ? '700' : '500'}
              bg={isActive(item) ? (onNavy ? 'whiteAlpha.200' : 'white') : 'transparent'}
              color={onNavy ? 'white' : M.navy}
            >
              {item.label}
            </CLink>
          ))}
          <Button
            as="a"
            href={`tel:${COMPANY.phone}`}
            mt={2}
            bg={M.orange}
            color="white"
            _hover={{ bg: M.orangeHover, color: 'white' }}
            borderRadius="full"
            leftIcon={<PhoneIcon />}
            sx={{ color: '#fff !important' }}
          >
            {COMPANY.phoneDisplay}
          </Button>
        </Stack>
      )}
    </Box>
  );
}

function MarketingShell({ children }: MarketingShellProps) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <Box minH="100dvh" bg={M.light} color={M.navy} fontFamily={M.font}>
      {/* On home, nav lives inside the navy hero card */}
      {!isHome && (
        <Box
          as="header"
          position="sticky"
          top={0}
          zIndex={40}
          bg="rgba(244,246,249,0.92)"
          backdropFilter="blur(12px)"
          borderBottom="1px solid"
          borderColor={M.line}
        >
          <Container maxW="7xl" py={{ base: 2, md: 3 }} px={{ base: 3, md: 6 }}>
            <MarketingTopNav variant="light" />
          </Container>
        </Box>
      )}

      <Box as="main">{children}</Box>

      <Box
        as="a"
        href={`https://wa.me/${COMPANY.phone.replace('+', '')}?text=${encodeURIComponent('Hello, I need manpower supply.')}`}
        target="_blank"
        rel="noopener noreferrer"
        position="fixed"
        right={{ base: 4, md: 6 }}
        bottom={{ base: 4, md: 6 }}
        zIndex={50}
        w="56px"
        h="56px"
        borderRadius="full"
        bg="#25D366"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow="0 8px 24px rgba(37,211,102,0.45)"
        _hover={{ transform: 'scale(1.06)' }}
        transition="transform 0.15s"
        aria-label="Chat on WhatsApp"
      >
        <Icon viewBox="0 0 24 24" boxSize={7} color="white">
          <path
            fill="currentColor"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
          />
        </Icon>
      </Box>

      <Box as="footer" bg={M.navyDeep} color="white">
        <Container maxW="7xl" py={{ base: 10, md: 14 }} px={{ base: 4, md: 6 }}>
          <Flex direction={{ base: 'column', lg: 'row' }} gap={{ base: 8, lg: 10 }} justify="space-between">
            <Stack maxW="280px" spacing={4}>
              <LogoBlock light />
              <Text fontSize="sm" color="whiteAlpha.700" lineHeight="1.75">
                Reliable manpower supply across India for construction, industry, warehouse and facility needs.
              </Text>
              <HStack spacing={3}>
                {['facebook', 'linkedin', 'youtube', 'whatsapp'].map((net) => (
                  <Box
                    key={net}
                    as="a"
                    href={net === 'whatsapp' ? `https://wa.me/${COMPANY.phone.replace('+', '')}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    w="36px"
                    h="36px"
                    borderRadius="full"
                    bg="whiteAlpha.150"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="11px"
                    fontWeight="700"
                    textTransform="uppercase"
                    _hover={{ bg: M.orange, color: 'white' }}
                    aria-label={net}
                  >
                    {net.slice(0, 2)}
                  </Box>
                ))}
              </HStack>
            </Stack>

            <Stack spacing={3} minW="140px">
              <Text fontWeight="700" fontSize="sm" color={M.orange}>
                Quick Links
              </Text>
              {NAV.filter((n) => !n.hash || n.hash === 'industries' || n.hash === 'testimonials').map((item) => (
                <CLink key={item.label} as={RouterLink} to={item.to} fontSize="sm" color="whiteAlpha.800" _hover={{ color: 'white' }}>
                  {item.label}
                </CLink>
              ))}
            </Stack>

            <Stack spacing={3} minW="160px">
              <Text fontWeight="700" fontSize="sm" color={M.orange}>
                Our Services
              </Text>
              {['Construction Manpower', 'Industrial Manpower', 'Warehouse & Helpers', 'Facility & Support'].map((s) => (
                <Text key={s} fontSize="sm" color="whiteAlpha.800">
                  {s}
                </Text>
              ))}
            </Stack>

            <Stack spacing={3} minW="220px">
              <Text fontWeight="700" fontSize="sm" color={M.orange}>
                Contact Us
              </Text>
              <Text fontSize="sm" color="whiteAlpha.700" lineHeight="1.8">
                {COMPANY.fullAddress}
              </Text>
              <CLink href={`tel:${COMPANY.phone}`} fontSize="sm" color="white" fontWeight="600">
                {COMPANY.phoneDisplay}
              </CLink>
              <CLink href={`mailto:${COMPANY.email}`} fontSize="sm" color="whiteAlpha.850">
                {COMPANY.email}
              </CLink>
            </Stack>
          </Flex>

          <Flex
            mt={10}
            pt={5}
            borderTop="1px solid"
            borderColor="whiteAlpha.200"
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            gap={3}
            fontSize="xs"
            color="whiteAlpha.550"
          >
            <Text>
              © {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
            </Text>
            <HStack spacing={3}>
              <Text>Privacy Policy</Text>
              <Text>|</Text>
              <Text>Terms &amp; Conditions</Text>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}

export default MarketingShell;
