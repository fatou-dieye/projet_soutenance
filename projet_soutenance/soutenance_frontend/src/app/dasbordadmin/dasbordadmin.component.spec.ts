import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DasbordadminComponent } from './dasbordadmin.component';

describe('DasbordadminComponent', () => {
  let component: DasbordadminComponent;
  let fixture: ComponentFixture<DasbordadminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DasbordadminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DasbordadminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
