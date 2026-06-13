// Déclarations de types globales pour les modules JavaScript

declare module '*.jsx' {
  const content: any;
  export default content;
  export const useAuth: any;
  export const useSystem: any;
}

declare module '*.js' {
  const content: any;
  export default content;
  export = content;
}
