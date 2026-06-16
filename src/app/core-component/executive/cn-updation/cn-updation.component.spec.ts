import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CnUpdationComponent } from './cn-updation.component';

describe('CnUpdationComponent', () => {
  let component: CnUpdationComponent;
  let fixture: ComponentFixture<CnUpdationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CnUpdationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CnUpdationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
