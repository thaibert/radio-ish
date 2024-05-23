import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { SpotifyAuth } from 'src/app/spotify/spotify-auth.service';
import { DefinedRoute, isDefinedRoute } from 'src/app/app.routes';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
  const spotify = inject(SpotifyAuth)
  const router =  inject(Router)

  const path = route.routeConfig?.path

  if (! isDefinedRoute(path)) {
    console.error(`Undefined path '${path}'`)
    router.navigate([''])
    return false
  }

  const otherwiseRedirectToLogin = (precondition: boolean): boolean => {
    if (precondition) { return true }
    router.navigate(
      ['login'],
      { queryParams: {returnPath: path} }
    )
    return false
  }

  const matches: Record<DefinedRoute, () => boolean> = {
    '': () => true,
    'login': () => true,
    'logged-in': () => true,
    'queue-recommendation': () => otherwiseRedirectToLogin(spotify.isAuthorized()),
  }
  return matches[path]()
}
