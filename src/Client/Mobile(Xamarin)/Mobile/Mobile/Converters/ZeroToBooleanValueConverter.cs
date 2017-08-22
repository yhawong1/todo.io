using System;
using System.Globalization;
using Xamarin.Forms;

namespace Mobile.Converters
{
    public sealed class ZeroToBooleanValueConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            int result;

            if (Int32.TryParse(value.ToString(), out result))
            {
                return result != 0;
            }
            return false;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }
}
