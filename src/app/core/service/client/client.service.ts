import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  constructor(private apiService: ApiService) {}

  getClients() {
    return this.apiService.get('client/list');
  }

  getClient(uuid: string) {
    return this.apiService.get('client/list/' + uuid);
  }

  createClient(client: any) {
    return this.apiService.post('client/create', client);
  }

  updateClient(client: any, uuid: any) {
    return this.apiService.put('client/update/' + uuid, client);
  }

  deleteClient(id: any) {
    return this.apiService.delete('client/delete/' + id);
  }

  getImageUrl(imageUrl: any){
    return this.apiService.post('file/get-presigned-url', imageUrl);
  }
}
