export function parseKeycloakUrl(keycloakUrl: string) {
    // Parse the URL
    const parsedUrl = new URL(keycloakUrl);
    const origin = parsedUrl.origin
    const keycloakBaseUrl = `${origin}/auth`
  
    // Split the path to get the segments
    const pathSegments = parsedUrl.pathname.split('/');
  
    // The realm is usually the second-to-last segment in the path
    const realmIndex = pathSegments.indexOf('realms') + 1;
  
    let realm
  
    // Check if we have a valid realm index
    if (realmIndex > 0 && realmIndex < pathSegments.length) {
      realm =  pathSegments[realmIndex];
    } 
    return {realm, keycloakBaseUrl}
  }
  