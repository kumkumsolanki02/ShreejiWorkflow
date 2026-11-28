import {
  Box,
  Container,
  Heading,
  Image,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import loginTeamMobile from '../../assets/login-team-mobile.png';
import SeoHead from '../../seo/SeoHead';
import { COMPANY, SEO_PAGES } from '../../seo/siteConfig';
import { PrimaryCta, SecondaryCta } from './components/MarketingCta';
import MarketingShell from './components/MarketingShell';

function ContactPage() {
  return (
    <MarketingShell>
      <SeoHead {...SEO_PAGES.contact} />

      <Box bg="slate.900" color="white">
        <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
          <Stack spacing={4} maxW="640px">
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color="brand.200">
              Contact
            </Text>
            <Heading as="h1" fontFamily='"Outfit", sans-serif' fontSize={{ base: '2rem', md: '3rem' }} letterSpacing="-0.03em">
              Request manpower
            </Heading>
            <Text color="whiteAlpha.800" fontSize={{ base: 'sm', md: 'lg' }} lineHeight="1.7">
              Share your city, headcount and role type. We respond for manpower supply across India.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container maxW="6xl" py={{ base: 10, md: 14 }} px={{ base: 4, md: 6 }}>
        <Box mb={8} borderRadius="xl" overflow="hidden" h={{ base: '160px', md: '220px' }} display={{ base: 'block', md: 'none' }}>
          <Image src={loginTeamMobile} alt="Contact Shreeji Caretaker for manpower" w="full" h="full" objectFit="cover" objectPosition="center top" />
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 8, md: 8 }}>
          <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="blackAlpha.100">
            <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize="md" mb={3}>
              Phone
            </Heading>
            <Link href={`tel:${COMPANY.phone}`} color="brand.600" fontWeight="700" fontSize="xl">
              {COMPANY.phoneDisplay}
            </Link>
            <Text mt={2} fontSize="sm" color="slate.500">
              Fastest for manpower requirements
            </Text>
            <PrimaryCta as="a" href={`tel:${COMPANY.phone}`} mt={5} w="full">
              Call now
            </PrimaryCta>
          </Box>

          <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="blackAlpha.100">
            <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize="md" mb={3}>
              Email
            </Heading>
            <Link
              href={`mailto:${COMPANY.email}?subject=Manpower%20requirement%20India`}
              color="brand.600"
              fontWeight="700"
              fontSize="sm"
              wordBreak="break-all"
            >
              {COMPANY.email}
            </Link>
            <Text mt={2} fontSize="sm" color="slate.500">
              Include city, count and skill type
            </Text>
            <SecondaryCta
              as="a"
              href={`mailto:${COMPANY.email}?subject=Manpower%20requirement%20India`}
              mt={5}
              w="full"
            >
              Email us
            </SecondaryCta>
          </Box>

          <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="blackAlpha.100">
            <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize="md" mb={3}>
              Office
            </Heading>
            <Text color="slate.700" fontSize="sm" lineHeight="1.85">
              {COMPANY.addressLine}
              <br />
              {COMPANY.city}, Distt. {COMPANY.district}
              <br />
              {COMPANY.state} {COMPANY.postalCode}
              <br />
              India
            </Text>
          </Box>
        </SimpleGrid>

        <Box
          mt={10}
          pt={6}
          borderTop="1px solid"
          borderColor="blackAlpha.100"
          itemScope
          itemType="https://schema.org/EmploymentAgency"
        >
          <meta itemProp="name" content={COMPANY.legalName} />
          <meta itemProp="url" content="https://shreejicaretaker.com/" />
          <Text fontSize="xs" color="slate.500" lineHeight="1.8" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
            <span itemProp="streetAddress">{COMPANY.addressLine}</span>,{' '}
            <span itemProp="addressLocality">{COMPANY.city}</span>,{' '}
            <span itemProp="addressRegion">{COMPANY.state}</span>{' '}
            <span itemProp="postalCode">{COMPANY.postalCode}</span>,{' '}
            <span itemProp="addressCountry">India</span>
            {' · '}
            <Link href={`tel:${COMPANY.phone}`} itemProp="telephone" color="brand.600">
              {COMPANY.phoneDisplay}
            </Link>
            {' · '}
            <Link href={`mailto:${COMPANY.email}`} itemProp="email" color="brand.600">
              {COMPANY.email}
            </Link>
          </Text>
        </Box>
      </Container>
    </MarketingShell>
  );
}

export default ContactPage;
