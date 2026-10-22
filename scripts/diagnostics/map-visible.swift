// macOS native smoke check. Input: a screenshot of the initial discovery screen.
// Checks viewport visibility, not tile connectivity or map gestures.
import Foundation
import Vision

guard CommandLine.arguments.count == 2 else {
  print("Usage: swift scripts/diagnostics/map-visible.swift <simulator-screenshot.png>")
  exit(2)
}
do {
  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  let handler = VNImageRequestHandler(url: URL(fileURLWithPath: CommandLine.arguments[1]))
  try handler.perform([request])
  let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
  let visible = lines.contains { $0.localizedCaseInsensitiveContains("Map not loading") }
  print(visible ? "PASS: native map controls visible in viewport" : "FAIL: native map controls absent from viewport")
  exit(visible ? 0 : 1)
} catch {
  print("Unable to inspect screenshot: \(error)")
  exit(2)
}
