import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecintoPage } from './recinto.page';

describe('RecintoPage', () => {
  let component: RecintoPage;
  let fixture: ComponentFixture<RecintoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecintoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
