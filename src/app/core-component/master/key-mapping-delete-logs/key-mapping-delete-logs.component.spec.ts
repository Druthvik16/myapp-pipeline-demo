import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyMappingDeleteLogsComponent } from './key-mapping-delete-logs.component';

describe('KeyMappingDeleteLogsComponent', () => {
  let component: KeyMappingDeleteLogsComponent;
  let fixture: ComponentFixture<KeyMappingDeleteLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KeyMappingDeleteLogsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeyMappingDeleteLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
