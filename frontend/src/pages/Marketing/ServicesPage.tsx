import { Box, Container, Heading, Image, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import bgLogin from '../../assets/bglogin.png';
import loginTeam from '../../assets/login-team.png';
import SeoHead from '../../seo/SeoHead';
import { COMPANY, SEO_PAGES } from '../../seo/siteConfig';
import { PrimaryCta, SecondaryCta } from './components/MarketingCta';
import MarketingShell from './components/MarketingShell';

const SERVICES = [
  {
    title: 'All India manpower supply',
    body: 'Contract manpower for industrial, commercial and facility work anywhere in India.',
    image: bgLogin,
  },
  {
    title: 'Factory & industrial labour',
    body: 'Production-floor and warehouse manpower — skilled and unskilled as per shift needs.',
    image: loginTeam,
  },
  {
    title: 'Site manpower',
    body: 'Construction and project-site workforce coordinated by location and headcount.',
    image: bgLogin,
  },
  {
    title: 'Caretaker manpower',
    body: 'Reliable caretaker teams for residential, commercial and institutional premises.',
    image: loginTeam,
  },
  {
    title: 'Helper & support staff',
    body: 'General helpers and support roles for offices, hotels, hospitals and facilities.',
    image: bgLogin,
  },
  {
    title: 'Short-notice deployment',
    body: 'Share city, count and role — we respond quickly for urgent manpower requirements.',
    image: loginTeam,
  },
] as const;

function ServicesPage() {
  return (
    <MarketingShell>
      <SeoHead {...SEO_PAGES.services} includeManpowerSchema />

      <Box bg="slate.900" color="white">
        <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
          <Stack spacing={4} maxW="640px">
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color="brand.200">
              Services
            </Text>
            <Heading as="h1" fontFamily='"Outfit", sans-serif' fontSize={{ base: '2rem', md: '3rem' }} letterSpacing="-0.03em">
              Manpower services across India
            </Heading>
            <Text color="whiteAlpha.800" fontSize={{ base: 'sm', md: 'lg' }} lineHeight="1.7">
              {COMPANY.shortName} supplies the workforce your site or facility needs — clear, professional, pan-India.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container maxW="6xl" py={{ base: 10, md: 14 }} px={{ base: 4, md: 6 }}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5} mb={10}>
          {SERVICES.map((service) => (
            <Box
              key={service.title}
              bg="white"
              borderRadius="xl"
              overflow="hidden"
              border="1px solid"
              borderColor="blackAlpha.100"
            >
              <Box
                mx={3}
                mt={3}
                borderRadius="lg"
                bg="linear-gradient(160deg, #E8EEF6 0%, #F7F9FC 55%, #EEF2F7 100%)"
                aspectRatio="16 / 11"
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={2}
                py={2}
              >
                <Image
                  src={service.image}
                  alt={service.title}
                  maxW="100%"
                  maxH="100%"
                  w="auto"
                  h="auto"
                  objectFit="contain"
                  objectPosition="center"
                  borderRadius="md"
                />
              </Box>
              <Box p={4}>
                <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize="md" mb={2}>
                  {service.title}
                </Heading>
                <Text color="slate.600" fontSize="sm" lineHeight="1.7">
                  {service.body}
                </Text>
              </Box>
            </Box>
          ))}
        </SimpleGrid>

        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
          <PrimaryCta as="a" href={`tel:${COMPANY.phone}`} size="lg" w={{ base: 'full', sm: 'auto' }}>
            Call {COMPANY.phoneDisplay}
          </PrimaryCta>
          <SecondaryCta as={RouterLink} to="/contact" size="lg" w={{ base: 'full', sm: 'auto' }}>
            Contact
          </SecondaryCta>
        </Stack>
      </Container>
    </MarketingShell>
  );
}

export default ServicesPage;
