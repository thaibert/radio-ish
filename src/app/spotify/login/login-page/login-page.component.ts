import { Component } from '@angular/core';
import { LoginDoRedirectComponent } from './do-redirect.component';
import { LoginHandleResponseComponent } from './handle-response.component';

enum LoginState {
  DidNotRedirectYet,
  ResponseReceived,
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginDoRedirectComponent, LoginHandleResponseComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  readonly LoginState = LoginState
  readonly state: LoginState

  constructor() {
    const wasRedirected =
      (params => params.has('code') || params.has('error'))(new URLSearchParams(window.location.search))
    this.state = wasRedirected ? LoginState.ResponseReceived : LoginState.DidNotRedirectYet
  }

}
