package de.unimannheim.ines;

import org.openapitools.codegen.*;
import org.openapitools.codegen.languages.JavascriptClientCodegen;

import io.swagger.v3.oas.models.OpenAPI;

import java.util.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.util.JSONPObject;

public class JavascriptAdapterGenerator extends JavascriptClientCodegen {

  /**
   * Configures a friendly name for the generator. This will be used by the
   * generator to select the library with the -g flag.
   *
   * @return the friendly name for the generator
   */
  public String getName() {
    return "javascript-adapter";
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

    if (additionalProperties.containsKey("operationId")) {
      boolean containsOperation = false;
      for (CodegenOperation co : opList) {
        boolean isOperation = co.operationId.equals(additionalProperties.get("operationId").toString());
        co.vendorExtensions.put("source", isOperation);
        containsOperation |= isOperation;
      }

      results.put("containsOperation", containsOperation);
    }

    return results;
  }

  @Override
  public void preprocessOpenAPI(OpenAPI openAPI) {
    super.preprocessOpenAPI(openAPI);

    if (additionalProperties.containsKey("targets")) {
      String[] b64TargetInfos = additionalProperties.get("targets").toString().split("\\.");

      ArrayList<Map<String, String>> targets = new ArrayList<>();

      for (String b64TargetInfo : b64TargetInfos) {
        byte[] decodedBytes = Base64.getDecoder().decode(b64TargetInfo);
        String stringifiedTargetInfo = new String(decodedBytes);

        ObjectMapper mapper = new ObjectMapper();
        try {
          Map<String, String> targetInfo = mapper.readValue(stringifiedTargetInfo, Map.class);
          targets.add(targetInfo);
        } catch (JsonProcessingException e) {
          e.printStackTrace();
        }
      }

      additionalProperties.put("targets", targets);
    }

    if (additionalProperties.containsKey("requestMapping")) {
      byte[] decodedBytes = Base64.getDecoder().decode(additionalProperties.get("requestMapping").toString());
      String decodedString = new String(decodedBytes);
      additionalProperties.put("requestMapping", decodedString.trim());
    }

    if (additionalProperties.containsKey("responseMapping")) {
      byte[] decodedBytes = Base64.getDecoder().decode(additionalProperties.get("responseMapping").toString());
      String decodedString = new String(decodedBytes);
      additionalProperties.put("responseMapping", decodedString.trim());
    }
  }

  public JavascriptAdapterGenerator() {
    super();
  }

}
