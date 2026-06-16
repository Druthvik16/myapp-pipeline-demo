import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { CommonSharedService } from '../service/common-shared/common-shared.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private commonSharedService: CommonSharedService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    console.log(document.URL);
    const userJson = sessionStorage.getItem('LOGINUSER') || '{}';
     const user = JSON.parse(userJson);
     const isLoggedIn = user && Object.keys(user).length > 0;
    if (!isLoggedIn) {
      if (state.url !== '/auth/signin') {
        this.router.navigateByUrl('/auth/signin');
      }
      return false;
    } else {
      return true;
    }
  }
}
