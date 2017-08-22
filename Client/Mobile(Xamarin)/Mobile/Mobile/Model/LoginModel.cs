using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mobile.Model
{
    [JsonObject]
    public class LoginModel : JsonSerializableObject
    {
        [JsonProperty]
        public string Email
        {
            get;set;
        }

        [JsonProperty]
        public string Password
        {
            get;set;
        }
    }
}
