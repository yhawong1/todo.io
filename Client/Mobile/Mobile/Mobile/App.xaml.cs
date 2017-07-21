using Mobile.ViewModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Xamarin.Forms;

namespace Mobile
{
    public partial class App : Application
    {
        private readonly LoginViewModel loginViewModel;

        public App()
        {
            InitializeComponent();

            MainPage = new Mobile.LoginPage();
            MainPage.BindingContext = new LoginViewModel();
        }

        protected override void OnStart()
        {
            // Handle when your app starts
        }

        protected override void OnSleep()
        {
            // Handle when your app sleeps
        }

        protected override void OnResume()
        {
            // Handle when your app resumes
        }
    }
}
