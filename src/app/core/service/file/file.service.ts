import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private apiService: ApiService) { }

  getFiles(clientUuid: string = '') {
    return this.apiService.get('file/list?client_uuid=' + clientUuid);
  }

  getFile(uuid: string) {
    return this.apiService.get('file/list/' + uuid);
  }

  getPreDesignedUrl(file: any) {
    return this.apiService.post('file/get-presigned-url', file);
  }

   getFileData(fileId: string) {
    return this.apiService.get('file/get-file-data?file_id=' + fileId);
  }

  updateFileData(file: any) {
    return this.apiService.post('file/update-file-data', file);
  }

   updateMappedFile(file: any) {
    return this.apiService.post('file/upload-mapped-file', file);
  }

  fileDownload(fileId: any){
    return this.apiService.getFile('file/download-file?file_id=' + fileId);
  }

  updateFileStatus(file: any){
    return this.apiService.post('file/update-file-status', file);
  }

  updateFileAcessStatus(fileId: any){
    return this.apiService.get('file/access/' + fileId);
  }

   removeFileAcessStatus(fileId: any){
    return this.apiService.get('file/access-remove/' + fileId);
  }
  
}
