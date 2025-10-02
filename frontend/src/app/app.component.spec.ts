import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
//ADD
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CustomerService, Customer } from './customer.service';
import { of } from 'rxjs';
//ADD
describe('AppComponent', () => {
  const customerServiceMock = {
    getCustomers: () => of([] as Customer[]),
    addCustomer: () => of({} as Customer),
    deleteCustomer: () => of(void 0)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [FormsModule, HttpClientTestingModule], //ADD
      providers: [{ provide: CustomerService, useValue: customerServiceMock }] //ADD
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have title "frontend"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toEqual('frontend');
  });

  it('should render header "Customer List"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Customer List');
  });
});
