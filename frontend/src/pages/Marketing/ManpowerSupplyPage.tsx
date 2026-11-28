import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import bgLogin from '../../assets/bglogin.png';
import loginTeam from '../../assets/login-team.png';
import loginTeamMobile from '../../assets/login-team-mobile.png';
import SeoHead from '../../seo/SeoHead';
import { COMPANY, SEO_PAGES } from '../../seo/siteConfig';
import { GhostOnDarkCta, PrimaryCta, SecondaryCta } from './components/MarketingCta';
import MarketingShell from './components/MarketingShell';

const NEEDS = [
  {
    title: 'All India manpower',
    body: 'Workforce supply for companies at any location in India — one partner for pan-India manpower needs.',
    image: bgLogin,
  },
  {
    title: 'Skilled & unskilled',
    body: 'Factory workers, helpers, industrial staff and site manpower matched to your requirement.',
    image: loginTeam,
  },
  {
    title: 'Industrial & site',
    body: 'Manpower for factories, warehouses, construction sites, offices and facility operations.',
    image: loginTeamMobile,
  },
  {
    title: 'Caretaker manpower',
    body: 'Dedicated caretaker teams for residential, commercial and institutional premises.',
    image: bgLogin,
  },
] as const;

const FAQS = [
  {
    q: 'Do you supply manpower across all India?',
    a: `Yes. Manpower supply across all India is our main work. Call ${COMPANY.phoneDisplay}.`,
  },
  {
    q: 'What manpower can I hire?',
    a: 'Skilled and unskilled manpower — industrial, site, helper and caretaker roles as per your need.',
  },
  {
    q: 'क्या पूरे भारत में मैनपावर सप्लाई होती है?',
    a: `हाँ। श्रीजी केयरटेकर पूरे भारत में मैनपावर सप्लाई करती है। संपर्क: ${COMPANY.phoneDisplay}`,
  },
] as const;

function ManpowerSupplyPage() {
  return (
    <MarketingShell>
      <SeoHead {...SEO_PAGES.manpower} includeManpowerSchema includeFaqSchema />

      <Box bg="slate.900" color="white">
        <Container maxW="6xl" py={{ base: 8, md: 14 }} px={{ base: 4, md: 6 }}>
          <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 6, md: 10 }} align="center">
            <Stack flex="1" spacing={4}>
              <Text fontSize="xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color="brand.200">
                Manpower supply
              </Text>
              <Heading
                as="h1"
                fontFamily='"Outfit", sans-serif'
                fontSize={{ base: '2rem', md: '3.2rem' }}
                letterSpacing="-0.03em"
                lineHeight="1.1"
              >
                Manpower across all India
              </Heading>
              <Text fontSize={{ base: 'sm', md: 'lg' }} color="whiteAlpha.800" lineHeight="1.75">
                {COMPANY.legalName} supplies skilled and unskilled manpower for factories, sites, offices and facilities
                nationwide.
              </Text>
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} pt={1}>
                <PrimaryCta as="a" href={`tel:${COMPANY.phone}`} size="lg" w={{ base: 'full', sm: 'auto' }}>
                  Call {COMPANY.phoneDisplay}
                </PrimaryCta>
                <GhostOnDarkCta as={RouterLink} to="/contact" w={{ base: 'full', sm: 'auto' }}>
                  Send requirement
                </GhostOnDarkCta>
              </Stack>
            </Stack>
            <Box
              flex="1"
              w="full"
              maxW={{ md: '420px' }}
              h={{ base: '200px', md: '280px' }}
              borderRadius="xl"
              overflow="hidden"
            >
              <Image src={bgLogin} alt="All India manpower supply team" w="full" h="full" objectFit="cover" />
            </Box>
          </Flex>
        </Container>
      </Box>

      <Container maxW="6xl" py={{ base: 10, md: 16 }} px={{ base: 4, md: 6 }}>
        <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize={{ base: 'xl', md: '2xl' }} mb={6} letterSpacing="-0.02em">
          What we supply
        </Heading>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={5} mb={{ base: 12, md: 16 }}>
          {NEEDS.map((item) => (
            <Box
              key={item.title}
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
                  src={item.image}
                  alt={item.title}
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
                <Heading as="h3" fontFamily='"Outfit", sans-serif' fontSize="md" mb={2}>
                  {item.title}
                </Heading>
                <Text fontSize="sm" color="slate.600" lineHeight="1.7">
                  {item.body}
                </Text>
              </Box>
            </Box>
          ))}
        </SimpleGrid>

        <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize={{ base: 'xl', md: '2xl' }} mb={4} letterSpacing="-0.02em">
          Common questions
        </Heading>
        <Stack spacing={0} mb={{ base: 10, md: 12 }}>
          {FAQS.map((faq) => (
            <Box key={faq.q} as="article" py={4} borderBottom="1px solid" borderColor="blackAlpha.100">
              <Heading as="h3" fontSize="md" mb={2}>
                {faq.q}
              </Heading>
              <Text fontSize="sm" color="slate.600" lineHeight="1.75">
                {faq.a}
              </Text>
            </Box>
          ))}
        </Stack>

        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ md: 'center' }}
          justify="space-between"
          gap={4}
          p={{ base: 5, md: 7 }}
          borderRadius="xl"
          bg="white"
          border="1px solid"
          borderColor="blackAlpha.100"
        >
          <Stack spacing={1}>
            <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize="lg">
              Need manpower in your city?
            </Heading>
            <Text fontSize="sm" color="slate.600">
              Call or email with city, headcount and role type.
            </Text>
          </Stack>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} w={{ base: 'full', md: 'auto' }}>
            <PrimaryCta as="a" href={`tel:${COMPANY.phone}`} w={{ base: 'full', sm: 'auto' }}>
              {COMPANY.phoneDisplay}
            </PrimaryCta>
            <SecondaryCta as="a" href={`mailto:${COMPANY.email}`} w={{ base: 'full', sm: 'auto' }}>
              Email
            </SecondaryCta>
          </Stack>
        </Flex>

        <Text mt={5} fontSize="sm" color="slate.500" lang="hi">
          पूरे भारत में मैनपावर सप्लाई —{' '}
          <Link href={`tel:${COMPANY.phone}`} color="brand.600" fontWeight="600">
            {COMPANY.phoneDisplay}
          </Link>
        </Text>
      </Container>
    </MarketingShell>
  );
}

export default ManpowerSupplyPage;
