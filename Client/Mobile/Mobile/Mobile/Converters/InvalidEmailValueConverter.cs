using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xamarin.Forms;

namespace Mobile.Converters
{
    public sealed class InvalidEmailValueConverter : EmptyStringValueConverter
    {
        private static readonly char[] mandatoryEmailChars = new[] { '@', '.' };

        /*
        public override object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            var resultFromBase = base.Convert(value, targetType, parameter, culture).ToString();
            bool result;

            if (Boolean.TryParse(resultFromBase, out result))
            {
                if (!result)
                {
                    var sValue = value.ToString();

                    var r = !mandatoryEmailChars.All(c => sValue.IndexOf(c) > -1);
                    return r;
                }

                return result;
            }

            return false;
        }
        */
    }
}
