import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/shoelace.js';

// Icons and lazy-loaded assets are served from this path (dev middleware + build copy).
setBasePath('/vendor/@shoelace/cdn@2.20.1/');
