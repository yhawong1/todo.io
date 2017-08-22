using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mobile.Model
{
    [JsonObject]
    public class UserAuth : JsonSerializableObject
    {
        [JsonProperty]
        public string Foo
        {
            get; set;
        }
    }
}
