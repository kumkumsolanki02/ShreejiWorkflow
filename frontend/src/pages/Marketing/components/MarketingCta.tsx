import { Button, type ButtonProps } from '@chakra-ui/react';

type CtaProps = ButtonProps & {
  href?: string;
  to?: string;
};

const BRAND_BG = 'linear-gradient(90deg, #4F46E5, #4338CA)';
const BRAND_BG_HOVER = 'linear-gradient(90deg, #4338CA, #3730A3)';

/** Solid CTA — forced brand bg + white text (works with as="a" / RouterLink). */
export function PrimaryCta(props: CtaProps) {
  const { sx, _hover, ...rest } = props;
  return (
    <Button
      border="none"
      boxShadow="0 4px 12px rgba(79, 70, 229, 0.28)"
      {...rest}
      sx={{
        background: `${BRAND_BG} !important`,
        color: '#ffffff !important',
        ...(typeof sx === 'object' && sx !== null ? sx : {}),
        a: { color: '#ffffff !important', textDecoration: 'none' },
        span: { color: '#ffffff !important' },
      }}
      _hover={{
        background: `${BRAND_BG_HOVER} !important`,
        color: '#ffffff !important',
        boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)',
        ...(typeof _hover === 'object' && _hover !== null ? _hover : {}),
      }}
      _active={{
        background: `${BRAND_BG_HOVER} !important`,
        color: '#ffffff !important',
      }}
    />
  );
}

/** Outline on light backgrounds. */
export function SecondaryCta(props: CtaProps) {
  const { sx, _hover, ...rest } = props;
  return (
    <Button
      variant="outline"
      bg="white"
      borderWidth="1.5px"
      borderColor="#C7D2FE"
      {...rest}
      sx={{
        background: '#ffffff !important',
        color: '#4338CA !important',
        ...(typeof sx === 'object' && sx !== null ? sx : {}),
        a: { color: '#4338CA !important', textDecoration: 'none' },
        span: { color: '#4338CA !important' },
      }}
      _hover={{
        background: '#EEF2FF !important',
        borderColor: '#A5B4FC',
        color: '#3730A3 !important',
        ...(typeof _hover === 'object' && _hover !== null ? _hover : {}),
      }}
    />
  );
}

/** Outline on dark backgrounds — forced white text. */
export function GhostOnDarkCta(props: CtaProps) {
  const { sx, _hover, ...rest } = props;
  return (
    <Button
      variant="unstyled"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      h="48px"
      px={6}
      borderRadius="10px"
      fontWeight="600"
      bg="transparent"
      border="1.5px solid"
      borderColor="rgba(255,255,255,0.8)"
      {...rest}
      sx={{
        color: '#ffffff !important',
        background: 'transparent',
        ...(typeof sx === 'object' && sx !== null ? sx : {}),
        a: { color: '#ffffff !important', textDecoration: 'none' },
        span: { color: '#ffffff !important' },
      }}
      _hover={{
        background: 'rgba(255,255,255,0.14) !important',
        borderColor: '#ffffff',
        color: '#ffffff !important',
        ...(typeof _hover === 'object' && _hover !== null ? _hover : {}),
      }}
      _active={{
        background: 'rgba(255,255,255,0.22) !important',
        color: '#ffffff !important',
      }}
    />
  );
}
