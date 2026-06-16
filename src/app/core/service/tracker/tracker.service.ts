import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class TrackerService {
  constructor(private apiService: ApiService) {}
 
 
    getDataTracker(client_uuid: string){
      return this.apiService.get(`tracker/data-tracker/?client_uuid=${client_uuid}`);
    }
    getFileTracker(state: string, client_uuid: string){
      return this.apiService.getFile(`tracker/file-tracker/?state=${state}&client_uuid=${client_uuid}`);
    }
    getBotLevelTracker(){
      return this.apiService.get(`bot/log/`);
    }
    getFileLevelTracker(client_uuid: string){
      return this.apiService.get(`tracker/file-level-tracker/?client_uuid=${client_uuid}`);
    }
    getFinalDataTracker(client_uuid: string, status: string = 'uploaded'){
      return this.apiService.get(`tracker/final-data-tracker/?client_uuid=${client_uuid}&status=${status}`);
    }

    getFinalDataTrackers(
  client_uuid: string,
  status: string,
  store_code: string,
  brand: string,
  month: string,
  year: string,
  fromDate: any,
  toDate: any
) {
  return this.apiService.get(
    'tracker/final-data-tracker/?client_uuid=' + client_uuid +
    '&status=' + status +
    '&store_code=' + store_code +
    '&brand=' + brand +
    '&month=' + month +
    '&year=' + year +
    '&fromDate=' + fromDate + '&toDate=' + toDate 
  );
}

getDataTrackers(
  client_uuid: string,
  year: string,
  month: string,
  region: string,
  brand: string
) {
  const params = new URLSearchParams();
  if (client_uuid) params.append('client_uuid', client_uuid);
  if (year) params.append('year', year.toString());
  if (month) params.append('month', month.toString());
  if (region) params.append('region', region);
  if (brand) params.append('brand', brand);

  return this.apiService.get(`tracker/data-tracker/?${params.toString()}`);
}


getBotLevelTrackers(status: string, fromDate: string, toDate: string) {
  const params = new URLSearchParams();

  if (status) params.append('status', status);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);

  return this.apiService.get(`bot/log/?${params.toString()}`);
}

 getFileLevelTrackers(client_uuid: string,status: any, fromDate: string, toDate: string){
  const params = new URLSearchParams();
  if (client_uuid) params.append('client_uuid', client_uuid);
       if (status) params.append('status', status);
  if (fromDate) params.append('from_date', fromDate);
  if (toDate) params.append('toDate', toDate);
      return this.apiService.get(`tracker/file-level-tracker/?${params.toString()}`);
    }
}

