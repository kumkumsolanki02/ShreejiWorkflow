import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Image,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useToast,
  type ButtonProps,
} from '@chakra-ui/react';
import { CheckCircleIcon, ChevronRightIcon, PhoneIcon } from '@chakra-ui/icons';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import heroWorkers from '../../assets/marketing/hero-workers.jpg';
import serviceConstruction from '../../assets/marketing/service-construction.jpg';
import serviceFacility from '../../assets/marketing/service-facility.jpg';
import serviceIndustrial from '../../assets/marketing/service-industrial.jpg';
import serviceWarehouse from '../../assets/marketing/service-warehouse.jpg';
import whyChoose from '../../assets/marketing/why-choose-workers.jpg';
import SeoHead from '../../seo/SeoHead';
import { COMPANY, SEO_PAGES } from '../../seo/siteConfig';
import {
  BuildingIcon,
  ConstructionIcon,
  FactoryIcon,
  GearIcon,
  HandshakeIcon,
  MapPinIcon,
  MoreGridIcon,
  RequirementIcon,
  RoadIcon,
  ShieldCheckIcon,
  StarIconSolid,
  WarehouseIcon,
  WorkforceIcon,
} from './components/MarketingIcons';
import MarketingShell, { MarketingTopNav } from './components/MarketingShell';
import { M } from './theme';

const SERVICES = [
  {
    title: 'Construction Manpower',
    body: 'Skilled & unskilled labour for construction projects.',
    image: serviceConstruction,
    Icon: ConstructionIcon,
  },
  {
    title: 'Industrial Manpower',
    body: 'Experienced workforce for factories & industries.',
    image: serviceIndustrial,
    Icon: FactoryIcon,
  },
  {
    title: 'Warehouse & Helpers',
    body: 'Packing, loading & warehouse staff.',
    image: serviceWarehouse,
    Icon: WarehouseIcon,
  },
  {
    title: 'Facility & Support Staff',
    body: 'Housekeeping, security and facility support staff.',
    image: serviceFacility,
    Icon: BuildingIcon,
  },
] as const;

const WHY = [
  'Skilled & Unskilled Workforce',
  'Quick Deployment',
  'Pan India Supply',
  'Flexible Requirements',
  'Dedicated Support',
] as const;

const STEPS = [
  { n: '01', title: 'Share Your Requirement', body: 'Tell us location, headcount and type of workers you need.', Icon: RequirementIcon },
  { n: '02', title: 'Get the Right Workforce', body: 'We shortlist and deploy skilled / unskilled manpower for your site.', Icon: WorkforceIcon },
  { n: '03', title: 'Start Your Project', body: 'Your team reports on time — focus on delivery while we handle staffing.', Icon: ShieldCheckIcon },
] as const;

const INDUSTRIES = [
  { title: 'Construction', Icon: ConstructionIcon },
  { title: 'Manufacturing', Icon: FactoryIcon },
  { title: 'Logistics & Warehousing', Icon: WarehouseIcon },
  { title: 'Facility Management', Icon: BuildingIcon },
  { title: 'Infrastructure', Icon: RoadIcon },
  { title: 'And More...', Icon: MoreGridIcon },
] as const;

const STATS = [
  { value: '500+', label: 'Workers Supplied', Icon: WorkforceIcon },
  { value: '50+', label: 'Clients Served', Icon: HandshakeIcon },
  { value: '10+', label: 'Industries', Icon: GearIcon },
  { value: 'Pan India', label: 'Presence', Icon: MapPinIcon },
] as const;

function OrangeBtn(props: ButtonProps & { href?: string; to?: string }) {
  const { sx, ...rest } = props;
  return (
    <Button
      bg={M.orange}
      color="white"
      borderRadius="full"
      fontWeight="700"
      px={6}
      _hover={{ bg: M.orangeHover, color: 'white' }}
      _active={{ bg: M.orangeHover, color: 'white' }}
      {...rest}
      sx={{
        color: '#fff !important',
        background: `${M.orange} !important`,
        a: { color: '#fff !important', textDecoration: 'none' },
        span: { color: '#fff !important' },
        ...(typeof sx === 'object' && sx !== null ? sx : {}),
      }}
    />
  );
}

/** Hero primary CTA — orange→yellow gradient, black label (mockup) */
function HireBtn(props: ButtonProps & { href?: string; to?: string }) {
  const { sx, ...rest } = props;
  return (
    <Button
      borderRadius="full"
      fontWeight="700"
      px={6}
      h="50px"
      bg="linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)"
      color="#0A192F"
      boxShadow="0 10px 28px rgba(245,158,11,0.4)"
      _hover={{ filter: 'brightness(1.05)', color: '#0A192F' }}
      _active={{ filter: 'brightness(0.97)' }}
      {...rest}
      sx={{
        color: '#0A192F !important',
        background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%) !important',
        a: { color: '#0A192F !important', textDecoration: 'none' },
        span: { color: '#0A192F !important' },
        svg: { color: '#0A192F !important' },
        ...(typeof sx === 'object' && sx !== null ? sx : {}),
      }}
    />
  );
}

function NavyBtn(props: ButtonProps & { href?: string; to?: string }) {
  const { sx, ...rest } = props;
  return (
    <Button
      bg={M.navy}
      color="white"
      borderRadius="full"
      fontWeight="700"
      px={7}
      h="48px"
      boxShadow="0 10px 28px rgba(10,35,66,0.28)"
      _hover={{ bg: M.navyMid, color: 'white' }}
      _active={{ bg: M.navyDeep, color: 'white' }}
      {...rest}
      sx={{
        color: '#fff !important',
        background: `${M.navy} !important`,
        a: { color: '#fff !important', textDecoration: 'none' },
        span: { color: '#fff !important' },
        ...(typeof sx === 'object' && sx !== null ? sx : {}),
      }}
    />
  );
}

function LandingPage() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  function handleQuote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const company = String(data.get('company') || '');
    const person = String(data.get('person') || '');
    const phone = String(data.get('phone') || '');
    const location = String(data.get('location') || '');
    const manpower = String(data.get('manpower') || '');
    const type = String(data.get('type') || '');
    const details = String(data.get('details') || '');

    const body = [
      'Manpower Requirement',
      `Company: ${company}`,
      `Contact: ${person}`,
      `Phone: ${phone}`,
      `Location: ${location}`,
      `Required Manpower: ${manpower}`,
      `Type: ${type}`,
      `Details: ${details}`,
    ].join('\n');

    setSubmitting(true);
    window.location.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent('Manpower Request — ' + company)}&body=${encodeURIComponent(body)}`;
    toast({
      title: 'Opening email to send your request…',
      status: 'success',
      duration: 3500,
      isClosable: true,
      position: 'top',
    });
    setSubmitting(false);
  }

  return (
    <MarketingShell>
      <SeoHead {...SEO_PAGES.home} includeBusinessSchema includeManpowerSchema includeFaqSchema />

      {/* ===== HERO ===== */}
      <Box px={{ base: 3, md: 4, lg: 5 }} pt={{ base: 3, md: 4 }} pb={{ base: 6, md: 14, lg: 16 }}>
        <Box position="relative" color="white">
          <Box
            position="relative"
            bg={M.navy}
            borderRadius={{ base: '22px', md: '36px', lg: '40px' }}
            overflow="hidden"
            minH={{ lg: '560px', xl: '600px' }}
            boxShadow="0 28px 64px rgba(10,25,47,0.28)"
            pb={{ base: 5, md: 16, lg: 18 }}
          >
            {/* Desktop / tablet side image only — keeps mobile text on clean navy */}
            <Box
              position="absolute"
              inset={0}
              zIndex={0}
              pointerEvents="none"
              display={{ base: 'none', md: 'block' }}
            >
              <Image
                src={heroWorkers}
                alt="Manpower workers at construction site"
                position="absolute"
                top={0}
                right={0}
                w={{ md: '55%', lg: '60%' }}
                h="100%"
                objectFit="cover"
                objectPosition="70% 22%"
              />
              <Box
                position="absolute"
                inset={0}
                bg={{
                  md: 'linear-gradient(90deg, #0A192F 0%, #0A192F 38%, rgba(10,25,47,0.82) 52%, rgba(10,25,47,0.3) 70%, rgba(10,25,47,0.05) 100%)',
                  lg: 'linear-gradient(90deg, #0A192F 0%, #0A192F 34%, rgba(10,25,47,0.85) 46%, rgba(10,25,47,0.35) 62%, rgba(10,25,47,0.06) 100%)',
                }}
              />
            </Box>

            <Flex direction="column" position="relative" zIndex={1} minH={{ lg: '560px', xl: '600px' }}>
              <Box px={{ base: 3.5, md: 5, lg: 7 }} pt={{ base: 3.5, md: 5, lg: 6 }}>
                <MarketingTopNav variant="onNavy" />
              </Box>

              {/* Mobile: one clear photo band (no double bg image) */}
              <Box display={{ base: 'block', md: 'none' }} px={3.5} pt={3}>
                <Box
                  h="168px"
                  borderRadius="16px"
                  overflow="hidden"
                  position="relative"
                >
                  <Image
                    src={heroWorkers}
                    alt="Skilled manpower team"
                    w="full"
                    h="full"
                    objectFit="cover"
                    objectPosition="center 18%"
                  />
                  <Box
                    position="absolute"
                    inset={0}
                    bg="linear-gradient(180deg, transparent 40%, rgba(10,25,47,0.45) 100%)"
                  />
                </Box>
              </Box>

              <Flex
                flex="1"
                align={{ base: 'flex-start', lg: 'center' }}
                px={{ base: 3.5, md: 5, lg: 7 }}
                pt={{ base: 4, md: 7, lg: 6 }}
                pb={{ base: 1, md: 4, lg: 6 }}
              >
                <Stack maxW={{ base: '100%', lg: '500px', xl: '540px' }} spacing={{ base: 3, md: 5 }} w="full">
                  <HStack
                    alignSelf="flex-start"
                    spacing={2}
                    bg="rgba(255,255,255,0.1)"
                    border="1px solid"
                    borderColor="rgba(255,255,255,0.2)"
                    px={3}
                    py={1.5}
                    borderRadius="full"
                  >
                    <ShieldCheckIcon color={M.orange} boxSize={3.5} />
                    <Text fontSize={{ base: '11px', md: '12px' }} fontWeight="600" color="white">
                      Trusted Manpower Partner
                    </Text>
                  </HStack>

                  <Heading
                    as="h1"
                    fontFamily={M.font}
                    fontSize={{ base: '1.75rem', sm: '2.2rem', md: '3.15rem', xl: '3.5rem' }}
                    lineHeight="1.15"
                    letterSpacing="-0.03em"
                    fontWeight="800"
                    color="white"
                  >
                    Reliable Manpower.
                    <Box as="span" display="block">
                      <Box as="span" color={M.orange}>
                        Stronger
                      </Box>{' '}
                      <Box as="span" color="white">
                        Business.
                      </Box>
                    </Box>
                  </Heading>

                  <Text fontSize={{ base: '13px', md: 'md' }} color="whiteAlpha.850" lineHeight="1.65" maxW="30rem">
                    Providing skilled &amp; unskilled manpower for industries, construction sites, factories and
                    facilities across India.
                  </Text>

                  <Stack direction="column" spacing={2.5} pt={1} w="full" display={{ base: 'flex', sm: 'none' }}>
                    <HireBtn
                      as={RouterLink}
                      to="/#request"
                      leftIcon={<WorkforceIcon boxSize={4} />}
                      rightIcon={<ChevronRightIcon boxSize={5} />}
                      w="full"
                      h="48px"
                    >
                      Hire Manpower
                    </HireBtn>
                    <Button
                      as="a"
                      href={`tel:${COMPANY.phone}`}
                      h="48px"
                      variant="unstyled"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="full"
                      border="1.5px solid"
                      borderColor="rgba(255,255,255,0.65)"
                      color="white"
                      px={6}
                      fontWeight="700"
                      leftIcon={<PhoneIcon boxSize={3.5} />}
                      w="full"
                      _hover={{ bg: 'whiteAlpha.150', color: 'white' }}
                      sx={{ color: '#fff !important' }}
                    >
                      Call Us Now
                    </Button>
                  </Stack>

                  <Stack direction="row" spacing={3} pt={1} w="full" display={{ base: 'none', sm: 'flex' }}>
                    <HireBtn
                      as={RouterLink}
                      to="/#request"
                      leftIcon={<WorkforceIcon boxSize={4} />}
                      rightIcon={<ChevronRightIcon boxSize={5} />}
                      h="50px"
                    >
                      Hire Manpower
                    </HireBtn>
                    <Button
                      as="a"
                      href={`tel:${COMPANY.phone}`}
                      h="50px"
                      variant="unstyled"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="full"
                      border="1.5px solid"
                      borderColor="rgba(255,255,255,0.65)"
                      color="white"
                      px={6}
                      fontWeight="700"
                      leftIcon={<PhoneIcon boxSize={3.5} />}
                      _hover={{ bg: 'whiteAlpha.150', color: 'white' }}
                      sx={{ color: '#fff !important' }}
                    >
                      Call Us Now
                    </Button>
                  </Stack>
                </Stack>
              </Flex>
            </Flex>
          </Box>

          {/* Stats — clean card under hero on mobile; floating pill on desktop */}
          <Box
            position={{ base: 'relative', md: 'absolute' }}
            left={{ md: 6, lg: 8 }}
            right={{ md: 6, lg: 8 }}
            bottom={{ md: '-36px', lg: '-40px' }}
            mt={{ base: 3, md: 0 }}
            zIndex={3}
          >
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              spacing={0}
              bg={{ base: M.navy, md: 'rgba(16, 36, 68, 0.96)' }}
              backdropFilter={{ md: 'blur(16px)' }}
              borderRadius={{ base: '18px', md: '999px' }}
              border="1px solid"
              borderColor="rgba(255,255,255,0.14)"
              boxShadow="0 14px 36px rgba(10,25,47,0.28)"
              px={{ base: 0, md: 2 }}
              py={{ base: 1, md: 3.5 }}
              sx={{
                '@media (min-width: 48em)': {
                  '& > *:not(:last-child)': { borderRight: '1px solid rgba(255,255,255,0.18)' },
                },
                '@media (max-width: 47.99em)': {
                  '& > *:nth-of-type(odd)': { borderRight: '1px solid rgba(255,255,255,0.1)' },
                  '& > *:nth-of-type(-n+2)': { borderBottom: '1px solid rgba(255,255,255,0.1)' },
                },
              }}
            >
              {STATS.map((s) => (
                <Flex
                  key={s.label}
                  direction={{ base: 'column', md: 'row' }}
                  align="center"
                  justify="center"
                  gap={{ base: 1, md: 3 }}
                  px={{ base: 2, md: 3, xl: 4 }}
                  py={{ base: 3, md: 1 }}
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  <s.Icon boxSize={{ base: 4, md: 5 }} color={{ base: M.orange, md: 'white' }} flexShrink={0} />
                  <Box>
                    <Text
                      fontSize={{ base: 'md', md: 'lg', xl: 'xl' }}
                      fontWeight="800"
                      color="white"
                      fontFamily={M.font}
                      lineHeight="1.1"
                    >
                      {s.value}
                    </Text>
                    <Text fontSize={{ base: '10px', md: '12px' }} color="whiteAlpha.700" fontWeight="500" lineHeight="1.25">
                      {s.label}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        </Box>
      </Box>

      {/* ===== SERVICES ===== */}
      <Box id="services" bg="white" pt={{ base: 10, md: 16, lg: 20 }} pb={{ base: 12, md: 16, lg: 20 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            gap={{ base: 10, lg: 6, xl: 10 }}
            align={{ base: 'stretch', lg: 'center' }}
          >
            <Stack
              flex={{ lg: '0 0 220px', xl: '0 0 250px' }}
              w={{ lg: '220px', xl: '250px' }}
              maxW="100%"
              spacing={4}
              flexShrink={0}
            >
              <HStack spacing={2.5} align="center">
                <Box w="28px" h="3px" bg={M.orange} borderRadius="full" flexShrink={0} />
                <Text fontFamily={M.font} fontWeight="700" fontSize="md" color={M.navy}>
                  Our Services
                </Text>
              </HStack>
              <Heading
                as="h2"
                fontFamily={M.font}
                fontSize={{ base: '1.55rem', md: '1.75rem', xl: '1.95rem' }}
                lineHeight="1.28"
                letterSpacing="-0.03em"
                color={M.navy}
              >
                Comprehensive Manpower Solutions for Every Need
              </Heading>
              <Text color="#5A6B7D" fontSize="sm" lineHeight="1.7">
                Skilled workforce. On-time deployment. Guaranteed support.
              </Text>
              <NavyBtn
                as={RouterLink}
                to="/services"
                alignSelf={{ base: 'stretch', sm: 'flex-start' }}
                w={{ base: 'full', sm: 'auto' }}
                fontSize="sm"
                rightIcon={<ChevronRightIcon boxSize={4} />}
              >
                Explore All Services
              </NavyBtn>
            </Stack>

            <Box flex="1" minW={0} w="full">
              <Box
                display="grid"
                gridTemplateColumns={{
                  base: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(4, minmax(0, 1fr))',
                }}
                gap={{ base: 8, sm: 5, lg: 4, xl: 5 }}
              >
                {SERVICES.map((service) => (
                  <Box
                    key={service.title}
                    bg="white"
                    borderRadius="18px"
                    overflow="visible"
                    minW={0}
                    boxShadow="0 16px 40px rgba(110, 140, 200, 0.2)"
                    transition="transform 0.2s ease, box-shadow 0.2s ease"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 48px rgba(110, 140, 200, 0.28)',
                    }}
                  >
                    <Box position="relative">
                      <Box
                        borderTopRadius="18px"
                        overflow="hidden"
                        aspectRatio="1 / 1"
                        bg="#D9E3EF"
                      >
                        <Image
                          src={service.image}
                          alt={service.title}
                          w="full"
                          h="full"
                          objectFit="cover"
                          objectPosition="center 18%"
                          draggable={false}
                        />
                      </Box>
                      <Flex
                        position="absolute"
                        left="50%"
                        bottom={0}
                        transform="translate(-50%, 50%)"
                        w={{ base: '48px', lg: '46px', xl: '50px' }}
                        h={{ base: '48px', lg: '46px', xl: '50px' }}
                        borderRadius="full"
                        bg="#1B5FA0"
                        align="center"
                        justify="center"
                        border="4px solid white"
                        boxShadow="0 4px 12px rgba(27,95,160,0.28)"
                        zIndex={2}
                        pointerEvents="none"
                      >
                        <service.Icon boxSize={4} color="white" />
                      </Flex>
                    </Box>

                    <Stack spacing={1.5} px={3} pt={8} pb={5} textAlign="center" align="center">
                      <Heading
                        as="h3"
                        fontSize={{ base: 'sm', lg: '0.8rem', xl: '0.88rem' }}
                        fontFamily={M.font}
                        fontWeight="700"
                        color={M.navy}
                        lineHeight="1.35"
                      >
                        {service.title}
                      </Heading>
                      <Text fontSize={{ base: 'xs', lg: '0.68rem', xl: '0.72rem' }} color="#7A8B9C" lineHeight="1.55">
                        {service.body}
                      </Text>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* ===== WHY CHOOSE US ===== */}
      <Box bg={M.navy} color="white" overflow="hidden">
        <Flex direction={{ base: 'column', lg: 'row' }} minH={{ lg: '420px' }}>
          <Stack flex="1" spacing={5} px={{ base: 5, md: 10, lg: 16 }} py={{ base: 12, md: 14 }} justify="center">
            <Heading as="h2" fontFamily={M.font} fontSize={{ base: '1.75rem', md: '2.35rem' }} letterSpacing="-0.02em">
              Why Choose Us
            </Heading>
            <Text color="whiteAlpha.700" fontSize="sm" maxW="420px" lineHeight="1.75">
              {COMPANY.shortName} works in all India manpower supply — dependable teams, clear communication, fast
              deployment.
            </Text>
            <Stack spacing={3} pt={1}>
              {WHY.map((item) => (
                <HStack key={item} spacing={3} align="flex-start">
                  <CheckCircleIcon color={M.orange} boxSize={5} mt={0.5} flexShrink={0} />
                  <Text fontWeight="600" fontSize={{ base: 'sm', md: 'sm' }}>
                    {item}
                  </Text>
                </HStack>
              ))}
            </Stack>
            <OrangeBtn as={RouterLink} to="/about" alignSelf={{ base: 'stretch', sm: 'flex-start' }} w={{ base: 'full', sm: 'auto' }} mt={2}>
              Know More
            </OrangeBtn>
          </Stack>
          <Box flex="1" position="relative" minH={{ base: '200px', lg: 'auto' }} order={{ base: -1, lg: 0 }}>
            <Image src={whyChoose} alt="Why choose Shreeji Caretaker manpower" w="full" h="full" objectFit="cover" position={{ lg: 'absolute' }} inset={{ lg: 0 }} />
            <Flex
              position="absolute"
              inset={0}
              align="center"
              justify="center"
              bg="blackAlpha.250"
            >
              <Flex
                as={RouterLink}
                to="/manpower-supply"
                w="64px"
                h="64px"
                borderRadius="full"
                bg="white"
                align="center"
                justify="center"
                boxShadow="0 10px 30px rgba(0,0,0,0.3)"
                _hover={{ transform: 'scale(1.06)' }}
                transition="transform 0.15s"
                aria-label="Learn more about manpower supply"
              >
                <Box
                  w={0}
                  h={0}
                  ml={1}
                  borderTop="10px solid transparent"
                  borderBottom="10px solid transparent"
                  borderLeft="16px solid"
                  borderLeftColor={M.navy}
                />
              </Flex>
            </Flex>
          </Box>
        </Flex>
      </Box>

      {/* ===== HOW IT WORKS ===== */}
      <Box bg="white" py={{ base: 12, md: 16 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <Stack spacing={2} textAlign="center" mb={{ base: 8, md: 12 }} maxW="640px" mx="auto">
            <Heading as="h2" fontFamily={M.font} fontSize={{ base: '1.6rem', md: '2.2rem' }} color={M.navy} letterSpacing="-0.02em">
              How It Works
            </Heading>
            <Text color={M.muted} fontSize="sm">
              Simple Process. Hassle-Free Hiring.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 6 }} position="relative">
            {STEPS.map((step, i) => (
              <Stack key={step.n} align="center" textAlign="center" spacing={3} position="relative" px={{ base: 2, md: 0 }}>
                {i < STEPS.length - 1 && (
                  <Box
                    display={{ base: 'none', md: 'block' }}
                    position="absolute"
                    top="28px"
                    left="60%"
                    w="80%"
                    h="2px"
                    bg={M.line}
                    zIndex={0}
                  />
                )}
                <Flex
                  w={{ base: '64px', md: '56px' }}
                  h={{ base: '64px', md: '56px' }}
                  borderRadius="full"
                  bg={M.navy}
                  color="white"
                  align="center"
                  justify="center"
                  zIndex={1}
                  border="3px solid"
                  borderColor={M.orange}
                  direction="column"
                  gap={0}
                >
                  <step.Icon boxSize={{ base: 5, md: 4 }} color={M.orange} mb={0.5} />
                  <Text fontWeight="800" fontSize="10px" lineHeight="1" color="white">
                    {step.n}
                  </Text>
                </Flex>
                <Heading as="h3" fontSize={{ base: 'sm', md: 'md' }} fontFamily={M.font} color={M.navy}>
                  {step.title}
                </Heading>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color={M.muted} maxW="260px" lineHeight="1.7">
                  {step.body}
                </Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ===== INDUSTRIES ===== */}
      <Box id="industries" bg={M.light} py={{ base: 12, md: 16 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <Stack spacing={2} textAlign="center" mb={8}>
            <Heading as="h2" fontFamily={M.font} fontSize={{ base: '1.6rem', md: '2.2rem' }} color={M.navy}>
              Industries We Serve
            </Heading>
            <Text color={M.muted} fontSize="sm">
              Manpower supply tailored for every sector
            </Text>
          </Stack>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={{ base: 3, md: 4 }}>
            {INDUSTRIES.map((ind) => (
              <Flex
                key={ind.title}
                bg="white"
                borderRadius="xl"
                p={{ base: 3, md: 5 }}
                align="center"
                gap={{ base: 2.5, md: 3 }}
                border="1px solid"
                borderColor={M.line}
                boxShadow="0 6px 18px rgba(10,35,66,0.05)"
                minH={{ base: '72px', md: 'auto' }}
              >
                <Flex
                  w={{ base: '40px', md: '44px' }}
                  h={{ base: '40px', md: '44px' }}
                  borderRadius="lg"
                  bg={M.orangeSoft}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <ind.Icon boxSize={{ base: 5, md: 5 }} color={M.navy} />
                </Flex>
                <Text fontWeight="700" fontSize={{ base: '11px', md: 'sm' }} color={M.navy} lineHeight="1.3">
                  {ind.title}
                </Text>
              </Flex>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ===== REQUEST FORM ===== */}
      <Box id="request" bg="white" py={{ base: 12, md: 16 }}>
        <Container maxW="7xl" px={{ base: 4, md: 6 }}>
          <Heading as="h2" fontFamily={M.font} fontSize={{ base: '1.6rem', md: '2.2rem' }} color={M.navy} mb={8} textAlign="center">
            Request Manpower Today!
          </Heading>
          <Grid
            templateColumns={{ base: '1fr', lg: '0.9fr 1.1fr' }}
            gap={0}
            borderRadius={{ base: 'xl', md: '2xl' }}
            overflow="hidden"
            boxShadow="0 16px 40px rgba(10,35,66,0.12)"
            border="1px solid"
            borderColor={M.line}
          >
            <Box position="relative" minH={{ base: '180px', lg: 'auto' }} bg={M.navy} color="white">
              <Image src={heroWorkers} alt="" position="absolute" inset={0} w="full" h="full" objectFit="cover" opacity={0.35} />
              <Stack position="relative" zIndex={1} spacing={3} p={{ base: 5, md: 8 }} h="full" justify="center">
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" color={M.orange}>
                  Get a Free Quote
                </Text>
                <Heading as="h3" fontSize={{ base: '1.25rem', md: '1.85rem' }} fontFamily={M.font}>
                  Tell us your manpower need
                </Heading>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="whiteAlpha.800" lineHeight="1.7">
                  Share site location and headcount — we respond quickly for all India manpower supply.
                </Text>
                <HStack spacing={2} pt={1} flexWrap="wrap">
                  <PhoneIcon color={M.orange} />
                  <Text as="a" href={`tel:${COMPANY.phone}`} fontWeight="700" fontSize={{ base: 'md', md: 'lg' }}>
                    {COMPANY.phoneDisplay}
                  </Text>
                </HStack>
              </Stack>
            </Box>

            <Box as="form" onSubmit={handleQuote} bg="white" p={{ base: 4, md: 8 }}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 4 }}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" color={M.muted}>Company Name</FormLabel>
                  <Input name="company" size="md" placeholder="Your company" borderColor={M.line} _focusVisible={{ borderColor: M.orange, boxShadow: `0 0 0 1px ${M.orange}` }} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" color={M.muted}>Contact Person</FormLabel>
                  <Input name="person" size="md" placeholder="Full name" borderColor={M.line} _focusVisible={{ borderColor: M.orange, boxShadow: `0 0 0 1px ${M.orange}` }} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" color={M.muted}>Phone Number</FormLabel>
                  <Input name="phone" size="md" type="tel" placeholder="+91" borderColor={M.line} _focusVisible={{ borderColor: M.orange, boxShadow: `0 0 0 1px ${M.orange}` }} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" color={M.muted}>Location / Site</FormLabel>
                  <Input name="location" size="md" placeholder="City / site address" borderColor={M.line} _focusVisible={{ borderColor: M.orange, boxShadow: `0 0 0 1px ${M.orange}` }} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color={M.muted}>Required Manpower</FormLabel>
                  <Select name="manpower" size="md" placeholder="Select count" borderColor={M.line}>
                    <option value="1-10">1–10</option>
                    <option value="11-50">11–50</option>
                    <option value="51-100">51–100</option>
                    <option value="100+">100+</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color={M.muted}>Type of Workers</FormLabel>
                  <Select name="type" size="md" placeholder="Select type" borderColor={M.line}>
                    <option value="skilled">Skilled</option>
                    <option value="unskilled">Unskilled</option>
                    <option value="both">Skilled & Unskilled</option>
                    <option value="caretaker">Caretaker / Facility</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl mt={4}>
                <FormLabel fontSize="xs" color={M.muted}>Requirement Details</FormLabel>
                <Textarea name="details" rows={3} placeholder="Role, shift, start date…" borderColor={M.line} _focusVisible={{ borderColor: M.orange, boxShadow: `0 0 0 1px ${M.orange}` }} />
              </FormControl>
              <OrangeBtn type="submit" w="full" mt={5} size="lg" h="48px" isLoading={submitting}>
                Submit Request
              </OrangeBtn>
            </Box>
          </Grid>
        </Container>
      </Box>

      {/* ===== TESTIMONIALS ===== */}
      <Box id="testimonials" bg={M.light} py={{ base: 12, md: 16 }}>
        <Container maxW="3xl" px={{ base: 4, md: 6 }}>
          <Heading as="h2" fontFamily={M.font} fontSize={{ base: '1.6rem', md: '2.1rem' }} color={M.navy} textAlign="center" mb={8}>
            What Our Clients Say
          </Heading>
          <Box bg="white" borderRadius={{ base: 'xl', md: '2xl' }} p={{ base: 5, md: 8 }} boxShadow="0 12px 32px rgba(10,35,66,0.08)" border="1px solid" borderColor={M.line}>
            <HStack spacing={1} mb={4} color={M.orange}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIconSolid key={i} boxSize={{ base: 4, md: 5 }} />
              ))}
            </HStack>
            <Text color={M.navy} fontSize={{ base: 'sm', md: 'lg' }} lineHeight="1.8" fontWeight="500" mb={6}>
              “Shreeji Caretaker supplied reliable manpower for our site on short notice. Coordination was clear and
              workers were punctual. Highly recommended for pan-India manpower needs.”
            </Text>
            <HStack spacing={3}>
              <Flex w="48px" h="48px" borderRadius="full" bg={M.navy} color="white" align="center" justify="center" fontWeight="800" flexShrink={0}>
                RM
              </Flex>
              <Box>
                <Text fontWeight="700" fontSize="sm" color={M.navy}>
                  Rajesh Mehta
                </Text>
                <Text fontSize="xs" color={M.muted}>
                  Project Manager, ABC Builders
                </Text>
              </Box>
            </HStack>
          </Box>
        </Container>
      </Box>
    </MarketingShell>
  );
}

export default LandingPage;
