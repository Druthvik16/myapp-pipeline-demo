import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonsListComponent } from './reasons-list.component';

describe('ReasonsListComponent', () => {
  let component: ReasonsListComponent;
  let fixture: ComponentFixture<ReasonsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReasonsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
