import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private apiService: ApiService) { }

    login(authParams: any){
     return this.apiService.post('auth/login', authParams);
  }
}
