import { Box, Container, Heading, Image, Stack, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import loginTeam from '../../assets/login-team.png';
import SeoHead from '../../seo/SeoHead';
import { COMPANY, SEO_PAGES } from '../../seo/siteConfig';
import { PrimaryCta, SecondaryCta } from './components/MarketingCta';
import MarketingShell from './components/MarketingShell';

function AboutPage() {
  return (
    <MarketingShell>
      <SeoHead {...SEO_PAGES.about} />

      <Box bg="slate.900" color="white">
        <Container maxW="3xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
          <Stack spacing={4}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.14em" textTransform="uppercase" color="brand.200">
              About us
            </Text>
            <Heading as="h1" fontFamily='"Outfit", sans-serif' fontSize={{ base: '2rem', md: '3rem' }} letterSpacing="-0.03em">
              {COMPANY.shortName}
            </Heading>
            <Text color="whiteAlpha.800" fontSize={{ base: 'sm', md: 'lg' }} lineHeight="1.75">
              All India manpower supply — from {COMPANY.city}, {COMPANY.state}.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container maxW="3xl" py={{ base: 10, md: 14 }} px={{ base: 4, md: 6 }}>
        <Box mb={8} borderRadius="xl" overflow="hidden" h={{ base: '180px', md: '240px' }}>
          <Image src={loginTeam} alt="Shreeji Caretaker company team" w="full" h="full" objectFit="cover" />
        </Box>

        <Stack spacing={6}>
          <Text color="slate.600" fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.85">
            {COMPANY.legalName} works in manpower supply across all India. We provide skilled and unskilled workforce
            for organizations, factories and sites that need dependable people on the ground.
          </Text>
          <Text color="slate.700" lineHeight="1.85" lang="hi" fontSize="sm">
            श्रीजी केयरटेकर कंपनी का मुख्य काम पूरे भारत में मैनपावर सप्लाई करना है।
          </Text>

          <Box>
            <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize="xl" mb={3}>
              Our approach
            </Heading>
            <Text color="slate.600" lineHeight="1.85" fontSize="sm">
              Manage People · Track Progress · Build Tomorrow — clear communication, reliable manpower, professional
              follow-through.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" fontFamily='"Outfit", sans-serif' fontSize="xl" mb={3}>
              Head office
            </Heading>
            <Text color="slate.700" lineHeight="1.9" whiteSpace="pre-line" fontSize="sm">
              {COMPANY.fullAddress}
              {'\n'}
              Phone: {COMPANY.phoneDisplay}
              {'\n'}
              Email: {COMPANY.email}
            </Text>
          </Box>

          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} pt={1}>
            <PrimaryCta as="a" href={`tel:${COMPANY.phone}`} w={{ base: 'full', sm: 'auto' }}>
              Call now
            </PrimaryCta>
            <SecondaryCta as={RouterLink} to="/contact" w={{ base: 'full', sm: 'auto' }}>
              Contact page
            </SecondaryCta>
          </Stack>
        </Stack>
      </Container>
    </MarketingShell>
  );
}

export default AboutPage;
