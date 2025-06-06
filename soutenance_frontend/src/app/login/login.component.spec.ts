import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogiComponent } from './login.component';

describe('LogiComponent', () => {
  let component: LogiComponent;
  let fixture: ComponentFixture<LogiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
