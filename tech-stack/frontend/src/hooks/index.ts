/**
 * Generic, domain-free hooks. `import { useDebounce, useAuth } from '@/hooks'`.
 *
 * A hook belongs here only if any feature could use it. Anything that knows
 * about a domain entity (useUsers, useInvoices) belongs in that feature slice's
 * `hooks/` folder instead.
 */
export { useAuth } from "./use-auth";
export { useCopyToClipboard } from "./use-copy-to-clipboard";
export { useDebounce, useDebouncedCallback } from "./use-debounce";
export { useDisclosure, type Disclosure } from "./use-disclosure";
export { useLocalStorage } from "./use-local-storage";
export {
  useIsDesktop,
  useMediaQuery,
  usePrefersReducedMotion,
} from "./use-media-query";
export { useIsMobile } from "./use-mobile";
export { useMounted } from "./use-mounted";
export { useTableParams } from "./use-table-params";
