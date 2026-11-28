import { ArrowForwardIcon, EmailIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  FormControl,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ApiError, markTabSession } from '../../../services/api';
import type { User } from '../../../types';
import { getDashboardPath } from '../../../app/authorization';

type LoginResponse = {
  user: User;
};

const ACCENT = '#6366F1';

function LoginForm() {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputStyles = {
    h: '46px',
    pl: '44px',
    bg: 'white',
    color: '#0F172A',
    fontSize: '14px',
    borderWidth: '1.5px',
    borderColor: '#E5E7EB',
    borderRadius: '12px',
    _placeholder: { color: '#94A3B8', fontSize: '14px' },
    _hover: { borderColor: '#C7CAF3' },
    _focusVisible: {
      borderColor: ACCENT,
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.14)',
    },
  };

  const inputIconStyles = {
    h: 'full',
    w: '44px',
    pointerEvents: 'none' as const,
    color: '#94A3B8',
    fontSize: '15px',
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password, rememberMe });
      markTabSession();
      navigate(getDashboardPath(data.user.role), {
        replace: true,
        state: { user: data.user },
      });
      toast({
        title: 'Signed in successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      toast({
        title: error instanceof ApiError ? error.message : 'Unable to sign in right now.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="12px" textAlign="left" w="full">
        <FormControl isRequired>
          <InputGroup>
            <InputLeftElement {...inputIconStyles}>
              <EmailIcon boxSize="15px" />
            </InputLeftElement>
            <Input
              {...inputStyles}
              autoComplete="email"
              name="email"
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </InputGroup>
        </FormControl>

        <FormControl isRequired>
          <InputGroup>
            <InputLeftElement {...inputIconStyles}>
              <LockIcon boxSize="15px" />
            </InputLeftElement>
            <Input
              {...inputStyles}
              pr="44px"
              autoComplete="current-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <InputRightElement h="full" w="44px">
              <IconButton
                variant="ghost"
                size="sm"
                color="#94A3B8"
                minW="auto"
                h="auto"
                p={1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                icon={showPassword ? <ViewOffIcon boxSize="15px" /> : <ViewIcon boxSize="15px" />}
                onClick={() => setShowPassword((visible) => !visible)}
                _hover={{ bg: 'transparent', color: '#64748B' }}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <HStack justify="space-between" align="center">
          <Checkbox
            colorScheme="brand"
            size="md"
            isChecked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            sx={{
              '.chakra-checkbox__control': {
                borderRadius: '4px',
                borderColor: '#CBD5E1',
                w: '15px',
                h: '15px',
                _checked: {
                  bg: ACCENT,
                  borderColor: ACCENT,
                  color: 'white',
                },
              },
              '.chakra-checkbox__label': {
                pl: '6px',
              },
            }}
          >
            <Text as="span" fontSize="13px" color="#475569" fontWeight="400">
              Remember me
            </Text>
          </Checkbox>
          <Button
            variant="link"
            color={ACCENT}
            fontSize="13px"
            fontWeight="600"
            type="button"
            h="auto"
            minW="auto"
            onClick={() => navigate('/forgot-password')}
            _hover={{ color: '#4F46E5', textDecoration: 'none' }}
          >
            Forgot password?
          </Button>
        </HStack>

        <Button
          type="submit"
          h="46px"
          borderRadius="12px"
          bg={`linear-gradient(90deg, #5B5FEF 0%, ${ACCENT} 40%, #818CF8 100%)`}
          color="white"
          fontSize="14.5px"
          fontWeight="600"
          letterSpacing="0.01em"
          boxShadow="0 12px 24px -12px rgba(99, 102, 241, 0.65)"
          _hover={{ bg: 'linear-gradient(90deg, #4F46E5 0%, #5B5FEF 45%, #6366F1 100%)' }}
          _active={{ bg: '#4F46E5' }}
          rightIcon={<ArrowForwardIcon boxSize="15px" />}
          iconSpacing="8px"
          isLoading={isSubmitting}
          loadingText="Signing in"
        >
          Sign In
        </Button>
      </Stack>
    </form>
  );
}

export default LoginForm;
