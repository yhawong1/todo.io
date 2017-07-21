using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mobile.Model
{
    public class JsonSerializableObject
    {
        public override string ToString()
        {
            return JsonConvert.SerializeObject(this);
        }

        public static T CreateFromJson<T>(string json)
            where T : JsonSerializableObject
        {
            return JsonConvert.DeserializeObject<T>(json);
        }
    }
}
