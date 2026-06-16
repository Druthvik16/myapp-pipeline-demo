import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonsAddComponent } from './reasons-add.component';

describe('ReasonsAddComponent', () => {
  let component: ReasonsAddComponent;
  let fixture: ComponentFixture<ReasonsAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReasonsAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
