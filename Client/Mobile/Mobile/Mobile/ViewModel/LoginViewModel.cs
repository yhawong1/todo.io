using Mobile.Model;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;

namespace Mobile.ViewModel
{
    public sealed class LoginViewModel : ViewModelBase
    {
        private string email;
        private string password;

        private LoginCommandImpl loginCommand;

        private static readonly char[] mandatoryEmailChars = new[] { '@', '.' };

        public LoginViewModel()
        {
            this.email = "patty_lau@hotmail.com";
            this.password = "12345678";
            this.loginCommand = new LoginCommandImpl(this);
            this.loginCommand.PropertyChanged += (s, v) =>
            {
                this.RaisedPropertyChangedEvent(v.PropertyName);
            };
        }

        public string Email
        {
            get { return this.email; }
            set
            {
                if (string.Compare(this.email, value, StringComparison.CurrentCultureIgnoreCase) != 0)
                {
                    this.email = value;
                    this.RaisedPropertyChangedEvent(nameof(Email));
                    this.RaisedPropertyChangedEvent(nameof(IsInvalidInput));
                    this.loginCommand.FireCanExecuteChangedEvent();
                }
            }
        }

        public string Password
        {
            get { return this.password; }
            set
            {
                if (string.Compare(this.password, value, StringComparison.CurrentCultureIgnoreCase) != 0)
                {
                    this.password = value;
                    this.RaisedPropertyChangedEvent(nameof(Password));
                    this.RaisedPropertyChangedEvent(nameof(IsInvalidInput));
                    this.loginCommand.FireCanExecuteChangedEvent();
                }
            }
        }

        public bool IsInvalidInput
        {
            get { return IsInvalidEmail(this.email) || IsInvalidPassword(this.password); }
        }

        public ICommand LoginCommand
        {
            get
            {
                return this.loginCommand;
            }
        }

        public bool LoginInProgress
        {
            get { return this.loginCommand.LoginInProgress; }
        }

        private static bool IsInvalidPassword(string password)
        {
            return string.IsNullOrEmpty(password);
        }

        private static bool IsInvalidEmail(string email)
        {
            return string.IsNullOrEmpty(email)
                || mandatoryEmailChars.Any(c => email.IndexOf(c) < 1);
        }

        private class LoginCommandImpl : ViewModelBase, ICommand
        {
            public event EventHandler CanExecuteChanged;

            private readonly LoginViewModel viewModel;
            private bool loginInProgress;

            public LoginCommandImpl(LoginViewModel viewModel)
            {
                this.viewModel = viewModel;
            }

            public bool CanExecute(object parameter)
            {
                return !this.viewModel.IsInvalidInput && !this.loginInProgress;
            }

            public void Execute(object parameter)
            {
                this.LoginInProgress = true;

                // submit http request
                HttpRequestHelpers.PostAsync<UserAuth>(new Uri("http://127.0.0.1/email?action=send"),
                    new UserAuth()
                    {
                        Foo = "Test"
                    },
                    result => 
                    {
                        this.LoginInProgress = false;
                    });
            }

            public bool LoginInProgress
            {
                get { return this.loginInProgress; }
                private set
                {
                    this.loginInProgress = value;
                    this.RaisedPropertyChangedEvent(nameof(LoginInProgress));
                    this.FireCanExecuteChangedEvent();
                }
            }

            public void FireCanExecuteChangedEvent()
            {
                var canExecuteChanged = this.CanExecuteChanged;

                if (canExecuteChanged != null)
                {
                    canExecuteChanged(this, new EventArgs());
                }
            }
        }
    }
}
