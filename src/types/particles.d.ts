declare module "particles.js" {
  const particlesJS: (tagId: string, config: object) => void;
  export default particlesJS;
}

interface Window {
  particlesJS: (tagId: string, config: object) => void;
}
