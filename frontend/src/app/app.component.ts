import { Component } from '@angular/core';
import { Customer, CustomerService } from './customer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend';
  darkMode = false;
  customers: Customer[] = [];
  newCustomer: Customer = { name: '', email: '' };

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe(data => this.customers = data);
  }

  addCustomer(): void {
    if (!this.newCustomer.name || !this.newCustomer.email) return;
    this.customerService.addCustomer(this.newCustomer).subscribe(() => {
      this.loadCustomers();
      this.newCustomer = { name: '', email: '' };
    });
  }

  deleteCustomer(id?: number): void {
    if (id) {
      this.customerService.deleteCustomer(id).subscribe(() => this.loadCustomers());
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    document.body.classList.toggle('dark-mode', this.darkMode);
  }
}
