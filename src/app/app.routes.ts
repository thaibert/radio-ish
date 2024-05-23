import { Route } from '@angular/router';
import { authGuard } from './auth-guard';

const routes: Record<string, Route> = {
  '': {
    loadComponent: () => import('src/app/pages/landing-page/landing-page.component').then(x => x.LandingPageComponent),
  },
  'login': { loadComponent: () => import('src/app/spotify/login/login.component').then(x => x.LoginComponent) },
  'logged-in': { loadComponent: () => import('src/app/spotify/logged-in/logged-in.component').then(x => x.LoggedInComponent) },
  'queue-recommendation': { loadChildren: () => import('src/app/pages/queue-recommendation/queue-recommendation.module').then(x => x.QueueRecommendationModule) },
}

export type DefinedRoute = keyof typeof routes

export const isDefinedRoute = (path: string | undefined | null): path is DefinedRoute => 
  path === undefined || path === null
    ? false
    : Object.keys(routes).includes(path)


export const routesForRouter: Route[] = (() => {
  const keysOf = <Key  extends string|number|symbol> (input: Record<Key, unknown>): Key[] => {
    return Object.keys(input)
      .map(key => key as Key)
  }

  return [
    ...(keysOf(routes).map(key => ({
      ...routes[key],
      path: key,
    }))),
    { path: '**', loadComponent: () => import('./pages/landing-page/landing-page.component').then(x => x.LandingPageComponent)}
  ].map(route => ({
    ...route,
    canActivate: [authGuard]
  }))
})()
