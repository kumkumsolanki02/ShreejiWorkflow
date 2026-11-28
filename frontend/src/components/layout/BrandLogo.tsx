import { Box, HStack, Image, Text, type ImageProps } from '@chakra-ui/react';

type BrandLogoProps = {
  compact?: boolean;
  isDark?: boolean;
  size?: 'sm' | 'md';
};

export function BrandMark(props: ImageProps) {
  return (
    <Image
      src="/logo.png"
      alt="Shreeji Caretaker"
      objectFit="contain"
      aria-hidden="true"
      {...props}
    />
  );
}

function BrandLogo({ compact = false, isDark = false, size = 'md' }: BrandLogoProps) {
  const isSmall = size === 'sm';

  return (
    <HStack spacing={isSmall ? 2.5 : 3} align="center" color={isDark ? 'white' : 'slate.900'}>
      <BrandMark boxSize={isSmall ? 18 : compact ? 20 : 16} />
      <Box>
        <Text
          fontFamily="heading"
          fontSize={isSmall ? 'lg' : compact ? '2xl' : 'xl'}
          fontWeight="800"
          lineHeight="1.15"
          letterSpacing="-0.01em"
        >
          Shreeji Caretaker
        </Text>
        {!compact && (
          <Text mt={1} color={isDark ? 'slate.200' : 'slate.500'} fontSize="xs">
            Manage People&nbsp; · &nbsp;Track Progress&nbsp; · &nbsp;Build Tomorrow
          </Text>
        )}
      </Box>
    </HStack>
  );
}

export default BrandLogo;
