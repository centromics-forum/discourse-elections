# discourse-elections 
![image](https://travis-ci.org/angusmcleod/discourse-elections.svg?branch=master)

See further: https://meta.discourse.org/t/elections-plugin/68521

## modified discourse source files 

- app/models/concerns/has_custom_fields.rb

```
    def serialize(value)
      base_type = Array === type ? type.first : type

      case base_type
      when :json
        value.to_json
      when :integer
        #value.to_i.to_s
        value.to_s     
      when :boolean
        value = !!Helpers::CUSTOM_FIELD_TRUE.include?(value) if String === value

        value ? "t" : "f"
      else
        case value
        when Hash
          value.to_json
        when TrueClass
          "t"
        when FalseClass
          "f"
        else
          value.to_s
        end
      end
    end
```



