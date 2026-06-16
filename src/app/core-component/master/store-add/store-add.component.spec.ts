import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreAddComponent } from './store-add.component';

describe('StoreAddComponent', () => {
  let component: StoreAddComponent;
  let fixture: ComponentFixture<StoreAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StoreAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
