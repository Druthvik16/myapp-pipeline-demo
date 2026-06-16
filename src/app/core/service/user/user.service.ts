import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) { }

  getUsers() {
    return this.apiService.get('user/list');
  }

  getUser(uuid: string) {
    return this.apiService.get('user/list/' + uuid);
  }

  createUser(client: any) {
    return this.apiService.post('user/create', client);
  }

  updateUser(client: any, uuid: any) {
    return this.apiService.put('user/update/' + uuid, client);
  }

  deleteUser(id: any) {
    return this.apiService.delete('user/delete/' + id);
  }

  getRoles() {
    return this.apiService.get('user/role/list');
  }

  getStaffs() {
    return this.apiService.get('user/staff/list');
  }

  createStaff(staff: any) {
    return this.apiService.post('user/staff/create', staff);
  }

  updateStaff(staff: any, uuid: any) {
    return this.apiService.put('user/staff/update/' + uuid, staff);
  }

  deleteStaff(id: any) {
    return this.apiService.delete('user/staff/delete/' + id);
  }

  getMappedHeaders(fileId: any){
    return this.apiService.get("user/getFormatedFileMappedHeaders?file_id=" + fileId);
  }

  changePassword(payload: any) {
    return this.apiService.put('user/change-password/' + payload.username, payload);
  }
}
