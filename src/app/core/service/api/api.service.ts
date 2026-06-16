import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}
  private baseUrl = environment.apiUrl + '/api/';

  get(url: string): any {
    return this.http.get(this.baseUrl + url);
  }

  getFile(url: string): any {
    return this.http.get(this.baseUrl + url, { responseType: 'blob' });
  }

  post(url: string, data: any): any {
    return this.http.post(this.baseUrl + url, data);
  }

  postFileBlob(url: string, data: any): any {
    return this.http.post(this.baseUrl + url, data, { responseType: 'blob' });
  }

  put(url: string, data: string): any {
    return this.http.put(`${this.baseUrl + url}`, data);
  }

  delete(url: string): any {
    return this.http.delete(`${this.baseUrl + url}`);
  }

  deleteByPayload(url: string, data: any): any {
    return this.http.delete(this.baseUrl + url, {
      body: data,
    });
  }

  getWithPayload(url: string, data: any): any {
    return this.http.get(this.baseUrl + url, data);
  }
}
