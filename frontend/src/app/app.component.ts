export class AppComponent {
  title = 'frontend';

  customers: Customer[] = [];
  newCustomer: Customer = { name: '', email: '' };

  // ===== Dark mode =====
  darkMode = false;
  toggleDarkMode() {
    this.darkMode = !this.darkMode;
  }
  // =====================

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe(data => this.customers = data);
  }

  addCustomer(): void {
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
}
