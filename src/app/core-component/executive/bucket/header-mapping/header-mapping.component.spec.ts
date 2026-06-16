import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderMappingComponent } from './header-mapping.component';

describe('HeaderMappingComponent', () => {
  let component: HeaderMappingComponent;
  let fixture: ComponentFixture<HeaderMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderMappingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
