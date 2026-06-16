export class routes {
  private static base = '';

  public static get baseUrl(): string {
    return this.base;
  }

  public static get signIn(): string {
    return this.base + '/auth/signin';
  }
  public static get signUp(): string {
    return this.base + '/signup';
  }
  public static get errorPages(): string {
    return this.baseUrl + '/error-pages';
  }
  public static get error404(): string {
    return this.errorPages + '/error-404';
  }

  public static get core(): string {
    return this.baseUrl;
  }
  public static get dashboard(): string {
    return this.baseUrl + '/dashboard';
  }
  public static get components(): string {
    return this.core + '/components';
  }

  public static get return(): string {
    return this.core + '/return';
  }
  public static get element(): string {
    return this.core + '/element';
  }

  public static get pages(): string {
    return this.core + '/pages';
  }

  public static get index(): string {
    return this.dashboard;
  }
  public static get signIn2(): string {
    return this.base + '/signin-2';
  }
  public static get signIn3(): string {
    return this.base + '/signin-3';
  }
  public static get resetPassword(): string {
    return this.base + '/reset-password';
  }
  public static get resetPassword3(): string {
    return this.base + '/reset-password-3';
  }

  public static get success(): string {
    return this.base + '/success';
  }
  public static get success2(): string {
    return this.base + '/success-2';
  }
  public static get success3(): string {
    return this.base + '/success-3';
  }
  public static get Horizontal(): string {
    return this.baseUrl + '/layout-horizontal';
  }
  public static get Detached(): string {
    return this.baseUrl + '/layout-detached';
  }
  public static get Modern(): string {
    return this.baseUrl + '/layout-modern';
  }
  public static get TwoColumn(): string {
    return this.baseUrl + '/layout-two-column';
  }

  public static get Boxed(): string {
    return this.baseUrl + '/layout-boxed';
  }
  public static get RTL(): string {
    return this.baseUrl + '/layout-rtl';
  }
  public static get Dark(): string {
    return this.baseUrl + '/layout-dark';
  }
  public static get client(): string {
    return this.baseUrl + '/clients';
  }

  public static get storeMaster(): string {
    return this.baseUrl + '/master/store';
  }

  public static get HeaderMaster(): string {
    return this.baseUrl + '/master/header-add';
  }

  public static get reasonsMaster(): string {
    return this.baseUrl + '/master/reasons';
  }

  public static get productHeaderMapping(): string {
    return this.baseUrl + '/master/header-mapping';
  }

  public static get productLists(): string {
    return this.baseUrl + '/master/product-lists';
  }
  
  public static get user(): string {
    return this.baseUrl + '/user';
  }

  public static get staff(): string {
    return this.baseUrl + '/staff';
  }

  //executive
   public static get executiveDashboad(): string {
    return this.baseUrl + '/executive/dashboard';
  }

  public static get formatted(): string {
    return this.baseUrl + '/executive/bucket/formatted';
  }

  public static get unformatted(): string {
    return this.baseUrl + '/executive/bucket/unformatted';
  }

    public static get dataFormatter(): string {
    return this.baseUrl + '/executive/bucket/data-formatter';
  }

   public static get headerMapping(): string {
    return this.baseUrl + '/executive/bucket/header-mapping';
  }

    public static get rejected(): string {
    return this.baseUrl + '/executive/bucket/rejected';
  }


   public static get uploaded(): string {
    return this.baseUrl + '/executive/bucket/uploaded';
  }

   public static get approved(): string {
    return this.baseUrl + '/executive/bucket/approved';
  }

   public static get uploadedData(): string {
    return this.baseUrl + '/executive/uploaded-data';
  }

  public static get discountBucket(): string {
    return this.baseUrl + '/executive/bucket/discount-bucket';
  }

    public static get deleted(): string {
    return this.baseUrl + '/executive/bucket/deleted';
  }

  //Team Lead
   public static get preApproval(): string {
    return this.baseUrl + '/team-lead/pre-scan-approval';
  }

  public static get reverification(): string {
    return this.baseUrl + '/team-lead/reverification';
  }

  public static get tracker(): string {
    return this.baseUrl + '/executive/tracker';
  }

  public static get botTracker(): string {
    return this.baseUrl + '/executive/bot-report';
  }
  public static get fileLevelTracker(): string {
    return this.baseUrl + '/executive/file-report';
  }
  public static get finalDataTracker(): string {
    return this.baseUrl + '/executive/final-report';
  }
}
