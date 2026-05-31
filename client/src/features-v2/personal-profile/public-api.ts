/**
 * features-v2/personal-profile — public surface for cross-feature imports.
 *
 * Other features (e.g. friend-feed → "click author to open their profile")
 * import only from here. Internal modules are not reachable cross-feature.
 */
export { PersonalProfilePage, personalProfileMockAdapter } from "./index";
