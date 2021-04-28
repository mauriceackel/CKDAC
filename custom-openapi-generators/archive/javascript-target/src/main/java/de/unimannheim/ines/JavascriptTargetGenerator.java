package de.unimannheim.ines;

import org.openapitools.codegen.*;
import org.openapitools.codegen.languages.JavascriptClientCodegen;

import java.util.*;

public class JavascriptTargetGenerator extends JavascriptClientCodegen {

  /**
   * Configures a friendly name for the generator. This will be used by the
   * generator to select the library with the -g flag.
   *
   * @return the friendly name for the generator
   */
  public String getName() {
    return "javascript-target";
  }

  /**
   * Provides an opportunity to inspect and modify operation data before the code
   * is generated.
   */
  @SuppressWarnings("unchecked")
  @Override
  public Map<String, Object> postProcessOperationsWithModels(Map<String, Object> objs, List<Object> allModels) {
    Map<String, Object> results = super.postProcessOperationsWithModels(objs, allModels);

    Map<String, Object> ops = (Map<String, Object>) results.get("operations");
    ArrayList<CodegenOperation> opList = (ArrayList<CodegenOperation>) ops.get("operation");

    if (!additionalProperties.containsKey("operationId")) {
      return results;
    }

    for (CodegenOperation co : opList) {
      boolean isOperation = co.operationId.equals(additionalProperties.get("operationId").toString());
      if (isOperation) {
        additionalProperties.put("targetApiName", ops.get("classname").toString());
        additionalProperties.put("targetBodyExists", false);
        if (co.bodyParam != null) {
          additionalProperties.put("targetBodyExists", true);
          additionalProperties.put("targetBodyName", co.bodyParam.paramName);
          additionalProperties.put("targetBodyRequired", co.bodyParam.required);
        }
        additionalProperties.put("targetHasOptional", co.vendorExtensions.get("x-codegen-has-optional-params"));
        additionalProperties.put("targetOptions", co.vendorExtensions.get("x-codegen-arg-list"));
        break;
      }
    }

    return results;
  }

  public JavascriptTargetGenerator() {
    super();

    supportingFiles.add(new SupportingFile("parsed-target.mustache", "", "parsed-target.txt"));
  }

}
