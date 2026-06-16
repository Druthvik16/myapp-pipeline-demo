import { TestBed } from '@angular/core/testing';

import { CommonSharedService } from './common-shared.service';

describe('CommonSharedService', () => {
  let service: CommonSharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonSharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
